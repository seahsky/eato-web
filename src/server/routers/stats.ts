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
  getWeekBounds,
  calculateWeeklyBudgetStatus,
  type WeekStartDay,
  type WeeklyBudgetStatus,
} from "@/lib/weekly-budget";
import { getEnergyBalance } from "@/lib/energy-balance";
import { typedAnyOutput } from "@/lib/openapi-helpers";

// Output schemas for OpenAPI
const dailySummaryOutputSchema = z.object({
  date: z.date(),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  totalFiber: z.number(),
  calorieGoal: z.number(),
  bmr: z.number().nullable(),
  tdee: z.number().nullable(),
  entries: z.array(z.any()),
});

export const statsRouter = router({
  // Get daily summary
  getDailySummary: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/stats/daily" } })
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format") }))
    .output(dailySummaryOutputSchema)
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
      };
    }),

  // Get weekly summary (last 7 days)
  getWeeklySummary: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/stats/weekly" } })
    .input(
      z.object({
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
      })
    )
    .output(
      typedAnyOutput<{
        days: Array<{
          date: Date;
          totalCalories: number;
          totalProtein: number;
          totalCarbs: number;
          totalFat: number;
          calorieGoal: number;
          goalMet: boolean;
        }>;
        averageCalories: number;
        totalCalories: number;
        daysOnGoal: number;
        calorieGoal: number;
      }>()
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
    .meta({ openapi: { method: "GET", path: "/stats/weekly-budget" } })
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
      })
    )
    .output(typedAnyOutput<WeeklyBudgetStatus>())
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

  // Get user's streak data
  getStreakData: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/stats/streak" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
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


  // ============================================
  // REST DAY PROCEDURES
  // ============================================

  // Declare a rest day
  declareRestDay: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/stats/rest-days" } })
    .input(z.object({
      date: z.string(),
    }))
    .output(z.any())
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
    .meta({ openapi: { method: "DELETE", path: "/stats/rest-days" } })
    .input(z.object({
      date: z.string(),
    }))
    .output(z.any())
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
  getRestDays: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/stats/rest-days" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
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
});

