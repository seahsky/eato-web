import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, format } from "date-fns";
import {
  getFlameSize,
  getNextMilestone,
  getMilestoneProgress,
  isStreakAtRisk,
  shouldResetRestDays,
  isRestDay,
  getWeeklyProgress,
  getNextWeeklyMilestone,
  MAX_REST_DAYS_PER_MONTH,
} from "@/lib/gamification/streaks";
import {
  shouldResetShields,
  checkShieldEligibility,
  applyPartnerShield,
  MAX_SHIELDS_PER_MONTH,
} from "@/lib/gamification/partner-shields";
import {
  getWeekBounds,
  calculateWeeklyBudgetStatus,
  type WeekStartDay,
} from "@/lib/weekly-budget";
import { getEnergyBalance } from "@/lib/energy-balance";

export const statsRouter = router({
  // Get daily summary
  getDailySummary: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format") }))
    .query(async ({ ctx, input }) => {
      // Parse YYYY-MM-DD as UTC midnight for consistent date handling across timezones
      const dayStart = new Date(input.date + "T00:00:00.000Z");

      const dailyLog = await ctx.prisma.dailyLog.findUnique({
        where: {
          userId_date: {
            userId: ctx.user.id,
            date: dayStart,
          },
        },
        include: {
          entries: {
            orderBy: { consumedAt: "asc" },
          },
        },
      });

      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });

      return {
        date: dayStart,
        totalCalories: dailyLog?.totalCalories ?? 0,
        totalProtein: dailyLog?.totalProtein ?? 0,
        totalCarbs: dailyLog?.totalCarbs ?? 0,
        totalFat: dailyLog?.totalFat ?? 0,
        totalFiber: dailyLog?.totalFiber ?? 0,
        calorieGoal: profile?.calorieGoal ?? 2000,
        bmr: profile?.bmr ?? null,
        tdee: profile?.tdee ?? null,
        entries: dailyLog?.entries ?? [],
        entriesByMeal: {
          BREAKFAST: dailyLog?.entries.filter((e) => e.mealType === "BREAKFAST") ?? [],
          LUNCH: dailyLog?.entries.filter((e) => e.mealType === "LUNCH") ?? [],
          DINNER: dailyLog?.entries.filter((e) => e.mealType === "DINNER") ?? [],
          SNACK: dailyLog?.entries.filter((e) => e.mealType === "SNACK") ?? [],
        },
      };
    }),

  // Get weekly summary (last 7 days)
  getWeeklySummary: protectedProcedure
    .input(
      z.object({
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // If no date provided, use today's date in a timezone-safe way
      const endDateStr = input.endDate ?? new Date().toISOString().split("T")[0];
      const endDate = new Date(endDateStr + "T00:00:00.000Z");
      const startDate = subDays(endDate, 6);

      const dailyLogs = await ctx.prisma.dailyLog.findMany({
        where: {
          userId: ctx.user.id,
          date: {
            gte: startDate,
            lte: endOfDay(endDate),
          },
        },
        orderBy: { date: "asc" },
      });

      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });

      // Create a map for quick lookup
      const logsByDate = new Map(
        dailyLogs.map((log) => [log.date.toISOString().split("T")[0], log])
      );

      // Generate all 7 days
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = subDays(endOfDay(endDate), 6 - i);
        const dateKey = startOfDay(date).toISOString().split("T")[0];
        const log = logsByDate.get(dateKey);

        days.push({
          date: startOfDay(date),
          totalCalories: log?.totalCalories ?? 0,
          totalProtein: log?.totalProtein ?? 0,
          totalCarbs: log?.totalCarbs ?? 0,
          totalFat: log?.totalFat ?? 0,
          calorieGoal: log?.calorieGoal ?? profile?.calorieGoal ?? 2000,
          goalMet: log ? log.totalCalories <= log.calorieGoal : false,
        });
      }

      // Calculate weekly averages
      const daysWithData = days.filter((d) => d.totalCalories > 0);
      const avgCalories =
        daysWithData.length > 0
          ? Math.round(
              daysWithData.reduce((sum, d) => sum + d.totalCalories, 0) /
                daysWithData.length
            )
          : 0;

      return {
        days,
        averageCalories: avgCalories,
        totalCalories: days.reduce((sum, d) => sum + d.totalCalories, 0),
        daysOnGoal: days.filter((d) => d.goalMet).length,
        calorieGoal: profile?.calorieGoal ?? 2000,
      };
    }),

  // Get weekly budget status (for Energy Balance feature)
  getWeeklyBudgetStatus: protectedProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Parse date or use today
      const targetDateStr = input.date ?? new Date().toISOString().split("T")[0];
      const targetDate = new Date(targetDateStr + "T00:00:00.000Z");

      // Get user's profile
      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });

      const dailyGoal = profile?.calorieGoal ?? 2000;
      const weekStartDay = (profile?.weekStartDay ?? 0) as WeekStartDay;
      const weeklyCalorieBudget = profile?.weeklyCalorieBudget ?? null;

      // Get week bounds
      const { start, end } = getWeekBounds(targetDate, weekStartDay);

      // Fetch all DailyLogs for the week
      const weekLogs = await ctx.prisma.dailyLog.findMany({
        where: {
          userId: ctx.user.id,
          date: {
            gte: start,
            lte: endOfDay(end),
          },
        },
      });

      // Get today's data
      const todayKey = format(targetDate, "yyyy-MM-dd");
      const todayLog = weekLogs.find(
        (log) => format(log.date, "yyyy-MM-dd") === todayKey
      );
      const dailyConsumed = todayLog?.totalCalories ?? 0;

      // Calculate weekly totals
      const weeklyConsumed = weekLogs.reduce((sum, log) => sum + log.totalCalories, 0);
      const daysLogged = weekLogs.filter((log) => log.totalCalories > 0).length;

      // Calculate full status
      const status = calculateWeeklyBudgetStatus({
        date: targetDate,
        dailyConsumed,
        dailyGoal,
        weeklyConsumed,
        weeklyCalorieBudget,
        daysLogged,
        weekStartDay,
      });

      return status;
    }),

  // Get partner's weekly budget status
  getPartnerWeeklyBudgetStatus: protectedProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get current user to find partner
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { partnerId: true },
      });

      if (!user?.partnerId) {
        return null;
      }

      // Parse date or use today
      const targetDateStr = input.date ?? new Date().toISOString().split("T")[0];
      const targetDate = new Date(targetDateStr + "T00:00:00.000Z");

      // Get partner's profile
      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: user.partnerId },
      });

      const dailyGoal = profile?.calorieGoal ?? 2000;
      const weekStartDay = (profile?.weekStartDay ?? 0) as WeekStartDay;
      const weeklyCalorieBudget = profile?.weeklyCalorieBudget ?? null;

      // Get week bounds
      const { start, end } = getWeekBounds(targetDate, weekStartDay);

      // Fetch partner's DailyLogs for the week
      const weekLogs = await ctx.prisma.dailyLog.findMany({
        where: {
          userId: user.partnerId,
          date: {
            gte: start,
            lte: endOfDay(end),
          },
        },
      });

      // Get today's data
      const todayKey = format(targetDate, "yyyy-MM-dd");
      const todayLog = weekLogs.find(
        (log) => format(log.date, "yyyy-MM-dd") === todayKey
      );
      const dailyConsumed = todayLog?.totalCalories ?? 0;

      // Calculate weekly totals
      const weeklyConsumed = weekLogs.reduce((sum, log) => sum + log.totalCalories, 0);
      const daysLogged = weekLogs.filter((log) => log.totalCalories > 0).length;

      // Calculate full status
      const status = calculateWeeklyBudgetStatus({
        date: targetDate,
        dailyConsumed,
        dailyGoal,
        weeklyConsumed,
        weeklyCalorieBudget,
        daysLogged,
        weekStartDay,
      });

      // Get partner name
      const partner = await ctx.prisma.user.findUnique({
        where: { id: user.partnerId },
        select: { name: true },
      });

      return {
        ...status,
        partnerName: partner?.name ?? "Partner",
      };
    }),

  // Get partner's daily summary
  getPartnerDailySummary: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format") }))
    .query(async ({ ctx, input }) => {
      // Get current user to find partner
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { partnerId: true },
      });

      if (!user?.partnerId) {
        return null;
      }

      // Parse YYYY-MM-DD as UTC midnight for consistent date handling across timezones
      const dayStart = new Date(input.date + "T00:00:00.000Z");

      const dailyLog = await ctx.prisma.dailyLog.findUnique({
        where: {
          userId_date: {
            userId: user.partnerId,
            date: dayStart,
          },
        },
        include: {
          entries: {
            where: {
              approvalStatus: "APPROVED",
            },
            orderBy: { consumedAt: "asc" },
          },
        },
      });

      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: user.partnerId },
      });

      const partner = await ctx.prisma.user.findUnique({
        where: { id: user.partnerId },
        select: { name: true },
      });

      const entries = dailyLog?.entries ?? [];

      return {
        partnerName: partner?.name ?? "Partner",
        date: dayStart,
        totalCalories: dailyLog?.totalCalories ?? 0,
        totalProtein: dailyLog?.totalProtein ?? 0,
        totalCarbs: dailyLog?.totalCarbs ?? 0,
        totalFat: dailyLog?.totalFat ?? 0,
        calorieGoal: profile?.calorieGoal ?? 2000,
        goalProgress: dailyLog
          ? Math.round(
              (dailyLog.totalCalories / (profile?.calorieGoal ?? 2000)) * 100
            )
          : 0,
        entriesByMeal: {
          BREAKFAST: entries.filter((e) => e.mealType === "BREAKFAST"),
          LUNCH: entries.filter((e) => e.mealType === "LUNCH"),
          DINNER: entries.filter((e) => e.mealType === "DINNER"),
          SNACK: entries.filter((e) => e.mealType === "SNACK"),
        },
      };
    }),

  // Get partner's weekly summary
  getPartnerWeeklySummary: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { partnerId: true },
    });

    if (!user?.partnerId) {
      return null;
    }

    const endDate = new Date();
    const startDate = subDays(startOfDay(endDate), 6);

    const dailyLogs = await ctx.prisma.dailyLog.findMany({
      where: {
        userId: user.partnerId,
        date: {
          gte: startDate,
          lte: endOfDay(endDate),
        },
      },
      orderBy: { date: "asc" },
    });

    const profile = await ctx.prisma.profile.findUnique({
      where: { userId: user.partnerId },
    });

    const partner = await ctx.prisma.user.findUnique({
      where: { id: user.partnerId },
      select: { name: true },
    });

    const currentGoal = profile?.calorieGoal ?? 2000;
    const todayStr = startOfDay(new Date()).toISOString().split("T")[0];
    const daysOnGoal = dailyLogs.filter((log) => {
      const logDateStr = log.date.toISOString().split("T")[0];
      const goalToUse = logDateStr === todayStr ? currentGoal : log.calorieGoal;
      return log.totalCalories <= goalToUse;
    }).length;

    return {
      partnerName: partner?.name ?? "Partner",
      daysOnGoal,
      totalDays: 7,
      averageCalories:
        dailyLogs.length > 0
          ? Math.round(
              dailyLogs.reduce((sum, d) => sum + d.totalCalories, 0) /
                dailyLogs.length
            )
          : 0,
      calorieGoal: profile?.calorieGoal ?? 2000,
    };
  }),

  // Get partner's history with food entries
  getPartnerHistory: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(14).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { partnerId: true },
      });

      if (!user?.partnerId) {
        return null;
      }

      const partner = await ctx.prisma.user.findUnique({
        where: { id: user.partnerId },
        select: { id: true, name: true },
      });

      if (!partner) {
        return null;
      }

      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: user.partnerId },
      });

      // Calculate date range (today and N-1 previous days)
      const endDate = new Date();
      const startDate = subDays(startOfDay(endDate), input.days - 1);

      const dailyLogs = await ctx.prisma.dailyLog.findMany({
        where: {
          userId: user.partnerId,
          date: {
            gte: startDate,
            lte: endOfDay(endDate),
          },
        },
        include: {
          entries: {
            where: {
              approvalStatus: "APPROVED",
            },
            orderBy: { consumedAt: "asc" },
          },
        },
        orderBy: { date: "desc" },
      });

      // Create a map for quick lookup
      const logsByDate = new Map(
        dailyLogs.map((log) => [log.date.toISOString().split("T")[0], log])
      );

      // Generate all days (most recent first)
      const days = [];
      const todayStr = startOfDay(new Date()).toISOString().split("T")[0];
      for (let i = 0; i < input.days; i++) {
        const date = subDays(startOfDay(endDate), i);
        const dateKey = date.toISOString().split("T")[0];
        const log = logsByDate.get(dateKey);

        const entries = log?.entries ?? [];
        // Use current profile goal for today, historical for past days
        const calorieGoal = dateKey === todayStr
          ? (profile?.calorieGoal ?? 2000)
          : (log?.calorieGoal ?? profile?.calorieGoal ?? 2000);

        days.push({
          date: dateKey,
          totalCalories: log?.totalCalories ?? 0,
          totalProtein: log?.totalProtein ?? 0,
          totalCarbs: log?.totalCarbs ?? 0,
          totalFat: log?.totalFat ?? 0,
          calorieGoal,
          entriesByMeal: {
            BREAKFAST: entries.filter((e) => e.mealType === "BREAKFAST"),
            LUNCH: entries.filter((e) => e.mealType === "LUNCH"),
            DINNER: entries.filter((e) => e.mealType === "DINNER"),
            SNACK: entries.filter((e) => e.mealType === "SNACK"),
          },
        });
      }

      return {
        partnerName: partner.name ?? "Partner",
        days,
      };
    }),

  // Get user's streak data
  getStreakData: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        goalStreak: true,
        longestGoalStreak: true,
        lastLogDate: true,
        streakFreezes: true,
        weeklyStreak: true,
        longestWeeklyStreak: true,
        currentWeekDays: true,
      },
    });

    if (!user) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        goalStreak: 0,
        longestGoalStreak: 0,
        streakFreezes: 0,
        flameSize: "none" as const,
        nextMilestone: 7,
        milestoneProgress: 0,
        streakAtRisk: false,
        weeklyStreak: 0,
        longestWeeklyStreak: 0,
        currentWeekDays: 0,
        weeklyProgress: 0,
        nextWeeklyMilestone: 4,
      };
    }

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      goalStreak: user.goalStreak,
      longestGoalStreak: user.longestGoalStreak,
      streakFreezes: user.streakFreezes,
      flameSize: getFlameSize(user.currentStreak),
      nextMilestone: getNextMilestone(user.currentStreak),
      milestoneProgress: getMilestoneProgress(user.currentStreak),
      streakAtRisk: isStreakAtRisk(user.lastLogDate, user.currentStreak),
      weeklyStreak: user.weeklyStreak,
      longestWeeklyStreak: user.longestWeeklyStreak,
      currentWeekDays: user.currentWeekDays,
      weeklyProgress: getWeeklyProgress(user.currentWeekDays),
      nextWeeklyMilestone: getNextWeeklyMilestone(user.weeklyStreak),
    };
  }),

  // Get partner's streak data (for mutual achievements)
  getPartnerStreakData: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { partnerId: true },
    });

    if (!user?.partnerId) {
      return null;
    }

    const partner = await ctx.prisma.user.findUnique({
      where: { id: user.partnerId },
      select: {
        name: true,
        currentStreak: true,
        longestStreak: true,
        goalStreak: true,
      },
    });

    if (!partner) {
      return null;
    }

    return {
      partnerName: partner.name ?? "Partner",
      currentStreak: partner.currentStreak,
      longestStreak: partner.longestStreak,
      goalStreak: partner.goalStreak,
      flameSize: getFlameSize(partner.currentStreak),
    };
  }),

  // Get partner's recent activity for activity feed
  getPartnerActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { partnerId: true },
      });

      if (!user?.partnerId) {
        return { items: [], nextCursor: undefined };
      }

      const thirtyDaysAgo = subDays(new Date(), 30);

      // Fetch all activity types in parallel
      const [foodEntries, dailyLogs, achievements, recipes, partner] = await Promise.all([
        // Recent food entries
        ctx.prisma.foodEntry.findMany({
          where: {
            userId: user.partnerId,
            approvalStatus: "APPROVED",
            loggedAt: { gte: thirtyDaysAgo },
          },
          orderBy: { loggedAt: "desc" },
          take: input.limit,
          select: {
            id: true,
            name: true,
            calories: true,
            mealType: true,
            loggedAt: true,
          },
        }),

        // Daily goal completions
        ctx.prisma.dailyLog.findMany({
          where: {
            userId: user.partnerId,
            goalMet: true,
            date: { gte: thirtyDaysAgo },
          },
          orderBy: { date: "desc" },
          take: input.limit,
          select: {
            id: true,
            date: true,
            totalCalories: true,
            calorieGoal: true,
          },
        }),

        // Badge unlocks
        ctx.prisma.achievement.findMany({
          where: {
            userId: user.partnerId,
            unlockedAt: { gte: thirtyDaysAgo },
          },
          orderBy: { unlockedAt: "desc" },
          take: input.limit,
          select: {
            id: true,
            badgeId: true,
            unlockedAt: true,
          },
        }),

        // Recipe creations
        ctx.prisma.recipe.findMany({
          where: {
            userId: user.partnerId,
            createdAt: { gte: thirtyDaysAgo },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          select: {
            id: true,
            name: true,
            yieldWeight: true,
            yieldUnit: true,
            createdAt: true,
          },
        }),

        // Partner name
        ctx.prisma.user.findUnique({
          where: { id: user.partnerId },
          select: { name: true, currentStreak: true },
        }),
      ]);

      // Import BADGES for badge details
      const { BADGES } = await import("@/lib/gamification/badges");

      // Transform into unified activity items
      type ActivityItem = {
        id: string;
        type: "food_logged" | "daily_goal_hit" | "streak_milestone" | "badge_earned" | "recipe_created";
        timestamp: Date;
        data: Record<string, unknown>;
      };

      const activityItems: ActivityItem[] = [];

      // Add food entries
      for (const entry of foodEntries) {
        activityItems.push({
          id: `food-${entry.id}`,
          type: "food_logged",
          timestamp: entry.loggedAt,
          data: {
            entryId: entry.id,
            foodName: entry.name,
            calories: entry.calories,
            mealType: entry.mealType,
          },
        });
      }

      // Add goal completions
      for (const log of dailyLogs) {
        activityItems.push({
          id: `goal-${log.id}`,
          type: "daily_goal_hit",
          timestamp: log.date,
          data: {
            date: log.date,
            calories: log.totalCalories,
            goal: log.calorieGoal,
          },
        });
      }

      // Add badge unlocks
      for (const achievement of achievements) {
        const badge = BADGES[achievement.badgeId];
        if (badge) {
          activityItems.push({
            id: `badge-${achievement.id}`,
            type: "badge_earned",
            timestamp: achievement.unlockedAt,
            data: {
              badgeId: badge.id,
              badgeName: badge.name,
              badgeIcon: badge.icon,
              rarity: badge.rarity,
            },
          });
        }
      }

      // Add recipe creations
      for (const recipe of recipes) {
        activityItems.push({
          id: `recipe-${recipe.id}`,
          type: "recipe_created",
          timestamp: recipe.createdAt,
          data: {
            recipeId: recipe.id,
            recipeName: recipe.name,
            yieldWeight: recipe.yieldWeight,
            yieldUnit: recipe.yieldUnit,
          },
        });
      }

      // Add streak milestones if partner has hit a milestone
      const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];
      if (partner?.currentStreak && STREAK_MILESTONES.includes(partner.currentStreak)) {
        // Get flame size for this streak
        const flameSize = getFlameSize(partner.currentStreak);

        // Find the most recent food entry or daily log to approximate when the streak was achieved
        const mostRecentLog = dailyLogs[0];
        const milestoneTimestamp = mostRecentLog?.date ?? new Date();

        activityItems.push({
          id: `streak-${partner.currentStreak}`,
          type: "streak_milestone",
          timestamp: milestoneTimestamp,
          data: {
            milestone: partner.currentStreak,
            flameSize,
          },
        });
      }

      // Sort by timestamp descending
      activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      const limitedItems = activityItems.slice(0, input.limit);

      return {
        items: limitedItems,
        partnerName: partner?.name ?? "Partner",
        nextCursor: limitedItems.length === input.limit ? limitedItems[limitedItems.length - 1]?.id : undefined,
      };
    }),

  // ============================================
  // REST DAY PROCEDURES
  // ============================================

  // Declare a rest day
  declareRestDay: protectedProcedure
    .input(z.object({
      date: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          restDayDates: true,
          restDaysRemaining: true,
          lastRestDayReset: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if monthly reset needed
      const needsReset = shouldResetRestDays(user.lastRestDayReset);
      let restDaysRemaining = user.restDaysRemaining;
      let lastRestDayReset = user.lastRestDayReset;

      if (needsReset) {
        restDaysRemaining = MAX_REST_DAYS_PER_MONTH;
        lastRestDayReset = new Date();
      }

      // Validate rest day allowance
      if (restDaysRemaining <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rest days remaining this month",
        });
      }

      const restDate = new Date(input.date);
      const today = startOfDay(new Date());
      const requestedDate = startOfDay(restDate);

      // Prevent retroactive rest days
      if (requestedDate < today) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot declare past dates as rest days",
        });
      }

      // Check if already declared
      const alreadyDeclared = user.restDayDates.some(
        (date) => startOfDay(date).toISOString() === requestedDate.toISOString()
      );

      if (alreadyDeclared) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This date is already declared as a rest day",
        });
      }

      // Add rest day
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          restDayDates: {
            push: restDate,
          },
          restDaysRemaining: restDaysRemaining - 1,
          ...(needsReset && { lastRestDayReset }),
        },
      });

      return {
        success: true,
        restDaysRemaining: restDaysRemaining - 1,
        restDayDate: restDate,
      };
    }),

  // Remove a rest day
  removeRestDay: protectedProcedure
    .input(z.object({
      date: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          restDayDates: true,
          restDaysRemaining: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const restDate = startOfDay(new Date(input.date));
      const updatedRestDays = user.restDayDates.filter(
        (date) => startOfDay(date).toISOString() !== restDate.toISOString()
      );

      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          restDayDates: updatedRestDays,
          restDaysRemaining: user.restDaysRemaining + 1,
        },
      });

      return { success: true };
    }),

  // Get all rest days
  getRestDays: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        restDayDates: true,
        restDaysRemaining: true,
        lastRestDayReset: true,
      },
    });

    if (!user) {
      return {
        restDayDates: [],
        restDaysRemaining: 6,
        needsReset: false,
      };
    }

    const needsReset = shouldResetRestDays(user.lastRestDayReset);

    return {
      restDayDates: user.restDayDates,
      restDaysRemaining: needsReset
        ? MAX_REST_DAYS_PER_MONTH
        : user.restDaysRemaining,
      needsReset,
    };
  }),

  // ============================================
  // PARTNER SHIELD PROCEDURES
  // ============================================

  // Get partner shield status
  getPartnerShieldStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        partnerId: true,
        partnerShields: true,
        shieldsUsedThisMonth: true,
        lastShieldReset: true,
        lastLogDate: true,
        currentStreak: true,
      },
    });

    if (!user?.partnerId) {
      return null;
    }

    // Check if monthly reset needed
    const needsReset = shouldResetShields(user.lastShieldReset);
    const currentShields = needsReset ? MAX_SHIELDS_PER_MONTH : user.partnerShields;

    // Get partner data
    const partner = await ctx.prisma.user.findUnique({
      where: { id: user.partnerId },
      select: {
        name: true,
        lastLogDate: true,
        currentStreak: true,
        partnerShields: true,
        lastShieldReset: true,
      },
    });

    if (!partner) {
      return null;
    }

    const partnerNeedsReset = shouldResetShields(partner.lastShieldReset);

    // Check if user can shield partner
    const userCanShield = checkShieldEligibility(
      partner.lastLogDate,
      partner.currentStreak,
      currentShields > 0
    );

    // Check if partner can shield user
    const partnerCanShield = checkShieldEligibility(
      user.lastLogDate,
      user.currentStreak,
      (partnerNeedsReset ? MAX_SHIELDS_PER_MONTH : partner.partnerShields) > 0
    );

    return {
      userShields: currentShields,
      partnerShields: partnerNeedsReset ? MAX_SHIELDS_PER_MONTH : partner.partnerShields,
      partnerName: partner.name ?? "Partner",
      userCanShield,
      partnerCanShield,
    };
  }),

  // Use shield on partner
  usePartnerShield: protectedProcedure
    .input(z.object({
      targetDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          partnerId: true,
          partnerShields: true,
          lastShieldReset: true,
        },
      });

      if (!user?.partnerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No partner linked",
        });
      }

      // Check if reset needed
      const needsReset = shouldResetShields(user.lastShieldReset);
      const currentShields = needsReset ? MAX_SHIELDS_PER_MONTH : user.partnerShields;

      if (currentShields <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No shields remaining this month",
        });
      }

      // Get partner
      const partner = await ctx.prisma.user.findUnique({
        where: { id: user.partnerId },
        select: {
          lastLogDate: true,
          currentStreak: true,
          name: true,
        },
      });

      if (!partner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Partner not found",
        });
      }

      // Validate eligibility
      const eligibility = checkShieldEligibility(
        partner.lastLogDate,
        partner.currentStreak,
        currentShields > 0
      );

      if (!eligibility.canUseShield) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: eligibility.reason ?? "Cannot use shield",
        });
      }

      const targetDate = new Date(input.targetDate);

      // Apply shield
      await applyPartnerShield(
        ctx.prisma,
        ctx.user.id,
        user.partnerId,
        targetDate
      );

      // Reset shields if needed
      if (needsReset) {
        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            lastShieldReset: new Date(),
          },
        });
      }

      return {
        success: true,
        partnerName: partner.name ?? "Partner",
        shieldedDate: targetDate,
        remainingShields: currentShields - 1,
      };
    }),

  // Get shield history
  getShieldHistory: protectedProcedure.query(async ({ ctx }) => {
    const [shieldsGiven, shieldsReceived] = await Promise.all([
      ctx.prisma.partnerShield.findMany({
        where: { fromUserId: ctx.user.id },
        include: {
          toUser: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.prisma.partnerShield.findMany({
        where: { toUserId: ctx.user.id },
        include: {
          fromUser: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      shieldsGiven: shieldsGiven.map((s) => ({
        date: s.shieldedDate,
        partnerName: s.toUser.name ?? "Partner",
        createdAt: s.createdAt,
      })),
      shieldsReceived: shieldsReceived.map((s) => ({
        date: s.shieldedDate,
        partnerName: s.fromUser.name ?? "Partner",
        createdAt: s.createdAt,
      })),
    };
  }),
});
