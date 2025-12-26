import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from "date-fns";
import {
  getFlameSize,
  getNextMilestone,
  getMilestoneProgress,
  isStreakAtRisk,
} from "@/lib/gamification/streaks";

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
});
