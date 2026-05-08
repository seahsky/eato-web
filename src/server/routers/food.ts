import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getProductByBarcode, getProductById } from "../services/fatsecret";
import { searchFoods, searchFoodsFast } from "../services/food-search";
import { analyzeFoodImage } from "../services/openai";
import { presignFoodPhotoUpload, uploadImage } from "../services/r2";
import { hashQuery, cleanupExpiredCache } from "../services/search-cache";
import { notifyBadgeUnlocked } from "@/lib/notifications/triggers";
import {
  calculateStreakUpdateWithRestDays,
  calculateWeeklyStreakUpdate,
  shouldResetRestDays,
  MAX_REST_DAYS_PER_MONTH,
} from "@/lib/gamification/streaks";
import {
  getStreakBadgesToUnlock,
  getWeeklyStreakBadgesToUnlock,
} from "@/lib/gamification/badges";

const foodEntrySchema = z.object({
  name: z.string().min(1).max(200),
  barcode: z.string().optional(),
  brand: z.string().max(100).nullable().optional(),
  imageUrl: z.string().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  servingSize: z.number().min(0),
  servingUnit: z.string(),
  mealGroupId: z.string().optional(),
  mood: z.string().max(10).optional(),
  note: z.string().max(500).optional(),
  consumedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  isManualEntry: z.boolean().default(false),
  dataSource: z.enum(["FATSECRET", "MANUAL", "OPEN_FOOD_FACTS", "USDA"]).default("MANUAL"),
  fatSecretId: z.string().optional(),
  // Legacy fields for backward compatibility
  openFoodFactsId: z.string().optional(),
  usdaFdcId: z.number().optional(),
});

export const foodRouter = router({
  // Unified search across USDA and Open Food Facts
  search: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/search" } })
    .input(
      z.object({
        query: z.string().min(2),
        page: z.number().min(1).default(1),
      })
    )
    .output(z.any())
    .query(async ({ input }) => {
      return searchFoods(input.query, input.page);
    }),

  // Fast search - returns cached results or fastest API response
  // Use this for progressive loading (shows results faster)
  searchFast: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/search-fast" } })
    .input(
      z.object({
        query: z.string().min(2),
      })
    )
    .output(z.any())
    .query(async ({ input }) => {
      return searchFoodsFast(input.query);
    }),

  // Batch search - search for multiple ingredients in parallel
  // Used by meal calculator to lookup all ingredients at once
  batchSearch: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/food/batch-search" } })
    .input(
      z.object({
        queries: z
          .array(
            z.object({
              id: z.string(),
              query: z.string().min(2),
            })
          )
          .max(15),
      })
    )
    .output(z.any())
    .query(async ({ input }) => {
      const results = await Promise.allSettled(
        input.queries.map(({ id, query }) =>
          searchFoodsFast(query, 5).then((result) => ({
            id,
            query,
            products: result.products.slice(0, 3),
          }))
        )
      );

      return results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        return {
          id: input.queries[index].id,
          query: input.queries[index].query,
          products: [],
          error: "Search failed",
        };
      });
    }),

  // Analyze a food photo using AI vision and return matched products
  analyzePhoto: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/food/analyze-photo" } })
    .input(
      z.object({
        image: z.string().max(2 * 1024 * 1024, "Image too large (max ~1.5MB)"),
      })
    )
    .output(z.any())
    .mutation(async ({ input }) => {
      const items = await analyzeFoodImage(input.image);

      if (items.length === 0) {
        return [];
      }

      // Search FatSecret for each identified item in parallel
      const results = await Promise.allSettled(
        items.map(({ name }) =>
          searchFoodsFast(name, 5).then((result) => ({
            query: name,
            products: result.products.slice(0, 3),
          }))
        )
      );

      return items.map((item, index) => {
        const result = results[index];
        const products =
          result.status === "fulfilled" ? result.value.products : [];
        const product = products[0] ?? null;

        const id = crypto.randomUUID();
        const grams = Math.round(item.estimatedGrams);

        if (product) {
          const factor = grams / 100;
          return {
            id,
            ingredientName: item.name,
            quantity: grams,
            normalizedGrams: grams,
            matchedProduct: product,
            calories: Math.round(product.caloriesPer100g * factor),
            protein:
              Math.round((product.proteinPer100g ?? 0) * factor * 10) / 10,
            carbs: Math.round((product.carbsPer100g ?? 0) * factor * 10) / 10,
            fat: Math.round((product.fatPer100g ?? 0) * factor * 10) / 10,
            servingSize: grams,
            servingUnit: "g",
          };
        }

        return {
          id,
          ingredientName: item.name,
          quantity: grams,
          normalizedGrams: grams,
          matchedProduct: null,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          servingSize: grams,
          servingUnit: "g",
        };
      });
    }),

  // Upload a food photo to R2
  uploadPhoto: protectedProcedure
    .input(
      z.object({
        image: z.string().max(2 * 1024 * 1024, "Image too large (max ~1.5MB)"),
        mealGroupId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const url = await uploadImage(input.image, ctx.user.id, input.mealGroupId);
      return { url };
    }),

  // Get a presigned PUT URL for direct R2 upload from the iOS client.
  // The client PUTs the image bytes to `uploadUrl`, then sends `publicUrl`
  // back as the entry's imageUrl when calling `food.log`.
  presignPhoto: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/food/photos/presign" } })
    .input(
      z.object({
        contentType: z
          .enum(["image/jpeg", "image/png"])
          .default("image/jpeg"),
      })
    )
    .output(
      z.object({
        uploadUrl: z.string().url(),
        publicUrl: z.string().url(),
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return presignFoodPhotoUpload(ctx.user.id, input.contentType);
    }),

  // Get product by barcode (FatSecret)
  getByBarcode: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/barcode/{barcode}" } })
    .input(z.object({ barcode: z.string() }))
    .output(z.any())
    .query(async ({ input }) => {
      const product = await getProductByBarcode(input.barcode);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      return product;
    }),

  // Get FatSecret food by food_id
  getByFatSecretId: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/fatsecret/{foodId}" } })
    .input(z.object({ foodId: z.string() }))
    .output(z.any())
    .query(async ({ input }) => {
      const food = await getProductById(input.foodId);
      if (!food) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food not found",
        });
      }
      return food;
    }),

  // Log food entry (self only).
  log: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/food/entries" } })
    .input(foodEntrySchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      // Parse YYYY-MM-DD as UTC midnight for consistent date handling across timezones
      const dayStart = new Date(input.consumedAt + "T00:00:00.000Z");
      const consumedAt = new Date(input.consumedAt + "T12:00:00.000Z");

      let dailyLog = await ctx.prisma.dailyLog.findUnique({
        where: { userId_date: { userId: ctx.user.id, date: dayStart } },
      });

      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });
      const calorieGoal = profile?.calorieGoal ?? 2000;

      if (!dailyLog) {
        dailyLog = await ctx.prisma.dailyLog.create({
          data: { userId: ctx.user.id, date: dayStart, calorieGoal },
        });
      }

      const entry = await ctx.prisma.foodEntry.create({
        data: {
          userId: ctx.user.id,
          dailyLogId: dailyLog.id,
          ...input,
          consumedAt,
        },
      });

      const updatedLog = await ctx.prisma.dailyLog.update({
        where: { id: dailyLog.id },
        data: {
          totalCalories: { increment: input.calories },
          totalProtein: { increment: input.protein ?? 0 },
          totalCarbs: { increment: input.carbs ?? 0 },
          totalFat: { increment: input.fat ?? 0 },
          totalFiber: { increment: input.fiber ?? 0 },
        },
      });

      const userData = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          currentStreak: true,
          longestStreak: true,
          goalStreak: true,
          longestGoalStreak: true,
          lastLogDate: true,
          streakFreezes: true,
          restDayDates: true,
          restDaysRemaining: true,
          lastRestDayReset: true,
          weeklyStreak: true,
          longestWeeklyStreak: true,
          currentWeekDays: true,
          weekStartDate: true,
          achievements: { select: { badgeId: true } },
          name: true,
        },
      });

      if (userData) {
        const needsRestDayReset = shouldResetRestDays(userData.lastRestDayReset);

        const streakResult = calculateStreakUpdateWithRestDays(
          {
            currentStreak: userData.currentStreak,
            longestStreak: userData.longestStreak,
            goalStreak: userData.goalStreak,
            longestGoalStreak: userData.longestGoalStreak,
            lastLogDate: userData.lastLogDate,
            streakFreezes: userData.streakFreezes,
            restDayDates: userData.restDayDates,
            restDaysRemaining: userData.restDaysRemaining,
            lastRestDayReset: userData.lastRestDayReset,
          },
          consumedAt
        );

        const weeklyResult = calculateWeeklyStreakUpdate(
          {
            weeklyStreak: userData.weeklyStreak,
            longestWeeklyStreak: userData.longestWeeklyStreak,
            currentWeekDays: userData.currentWeekDays,
            weekStartDate: userData.weekStartDate,
          },
          consumedAt
        );

        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            currentStreak: streakResult.newStreak,
            longestStreak: streakResult.longestStreak,
            streakFreezes: streakResult.freezesRemaining,
            lastLogDate: consumedAt,
            weeklyStreak: weeklyResult.weeklyStreak,
            longestWeeklyStreak: weeklyResult.longestWeeklyStreak,
            currentWeekDays: weeklyResult.currentWeekDays,
            weekStartDate: weeklyResult.weekStartDate,
            ...(needsRestDayReset && {
              restDaysRemaining: MAX_REST_DAYS_PER_MONTH,
              lastRestDayReset: new Date(),
            }),
          },
        });

        const unlockedBadgeIds = userData.achievements.map((a) => a.badgeId);
        const newDailyBadges = getStreakBadgesToUnlock(streakResult.newStreak, unlockedBadgeIds);
        const newWeeklyBadges = getWeeklyStreakBadgesToUnlock(weeklyResult.weeklyStreak, unlockedBadgeIds);
        const newBadges = [...newDailyBadges, ...newWeeklyBadges];

        for (const badgeId of newBadges) {
          try {
            await ctx.prisma.achievement.create({
              data: { userId: ctx.user.id, badgeId },
            });
          } catch {
            // Ignore duplicate key errors
          }
        }

        if (newBadges.length > 0) {
          const { BADGES } = await import("@/lib/gamification/badges");
          const badgeNames = newBadges
            .map((id) => BADGES[id]?.name)
            .filter(Boolean) as string[];
          notifyBadgeUnlocked(ctx.user.id, badgeNames).catch(() => {});
        }
      }

      const goalProgress = updatedLog.totalCalories / updatedLog.calorieGoal;
      if (!updatedLog.goalMet && goalProgress >= 0.9 && goalProgress <= 1.0) {
        await ctx.prisma.dailyLog.update({
          where: { id: dailyLog.id },
          data: { goalMet: true },
        });
      }

      return entry;
    }),

  // Batch log multiple food entries at once (meal group)
  batchLog: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/food/batch-log" } })
    .input(
      z.object({
        entries: z.array(foodEntrySchema).min(1).max(15),
        mealGroupId: z.string(),
        consumedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const dayStart = new Date(input.consumedAt + "T00:00:00.000Z");
      const consumedAt = new Date(input.consumedAt + "T12:00:00.000Z");

      // Get or create daily log
      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });
      const calorieGoal = profile?.calorieGoal ?? 2000;

      let dailyLog = await ctx.prisma.dailyLog.findUnique({
        where: {
          userId_date: {
            userId: ctx.user.id,
            date: dayStart,
          },
        },
      });

      if (!dailyLog) {
        dailyLog = await ctx.prisma.dailyLog.create({
          data: {
            userId: ctx.user.id,
            date: dayStart,
            calorieGoal,
          },
        });
      }

      // Create all food entries
      const createdEntries = [];
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;

      for (const entryData of input.entries) {
        const { consumedAt: _entryDate, mealGroupId: _mg, ...rest } = entryData;
        const entry = await ctx.prisma.foodEntry.create({
          data: {
            userId: ctx.user.id,
            dailyLogId: dailyLog!.id,
            ...rest,
            mealGroupId: input.mealGroupId,
            consumedAt,
          },
        });
        createdEntries.push(entry);
        totalCalories += entryData.calories;
        totalProtein += entryData.protein ?? 0;
        totalCarbs += entryData.carbs ?? 0;
        totalFat += entryData.fat ?? 0;
        totalFiber += entryData.fiber ?? 0;
      }

      // Update daily log totals once
      const updatedLog = await ctx.prisma.dailyLog.update({
        where: { id: dailyLog.id },
        data: {
          totalCalories: { increment: totalCalories },
          totalProtein: { increment: totalProtein },
          totalCarbs: { increment: totalCarbs },
          totalFat: { increment: totalFat },
          totalFiber: { increment: totalFiber },
        },
      });

      // Update streaks once for the batch
      const userData = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          currentStreak: true,
          longestStreak: true,
          goalStreak: true,
          longestGoalStreak: true,
          lastLogDate: true,
          streakFreezes: true,
          restDayDates: true,
          restDaysRemaining: true,
          lastRestDayReset: true,
          weeklyStreak: true,
          longestWeeklyStreak: true,
          currentWeekDays: true,
          weekStartDate: true,
          achievements: { select: { badgeId: true } },
          name: true,
        },
      });

      if (userData) {
        const needsRestDayReset = shouldResetRestDays(userData.lastRestDayReset);
        const streakResult = calculateStreakUpdateWithRestDays(
          {
            currentStreak: userData.currentStreak,
            longestStreak: userData.longestStreak,
            goalStreak: userData.goalStreak,
            longestGoalStreak: userData.longestGoalStreak,
            lastLogDate: userData.lastLogDate,
            streakFreezes: userData.streakFreezes,
            restDayDates: userData.restDayDates,
            restDaysRemaining: userData.restDaysRemaining,
            lastRestDayReset: userData.lastRestDayReset,
          },
          consumedAt
        );
        const weeklyResult = calculateWeeklyStreakUpdate(
          {
            weeklyStreak: userData.weeklyStreak,
            longestWeeklyStreak: userData.longestWeeklyStreak,
            currentWeekDays: userData.currentWeekDays,
            weekStartDate: userData.weekStartDate,
          },
          consumedAt
        );

        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            currentStreak: streakResult.newStreak,
            longestStreak: streakResult.longestStreak,
            streakFreezes: streakResult.freezesRemaining,
            lastLogDate: consumedAt,
            weeklyStreak: weeklyResult.weeklyStreak,
            longestWeeklyStreak: weeklyResult.longestWeeklyStreak,
            currentWeekDays: weeklyResult.currentWeekDays,
            weekStartDate: weeklyResult.weekStartDate,
            ...(needsRestDayReset && {
              restDaysRemaining: MAX_REST_DAYS_PER_MONTH,
              lastRestDayReset: new Date(),
            }),
          },
        });

        // Check for new badges
        const unlockedBadgeIds = userData.achievements.map((a) => a.badgeId);
        const newDailyBadges = getStreakBadgesToUnlock(streakResult.newStreak, unlockedBadgeIds);
        const newWeeklyBadges = getWeeklyStreakBadgesToUnlock(weeklyResult.weeklyStreak, unlockedBadgeIds);
        const newBadges = [...newDailyBadges, ...newWeeklyBadges];

        for (const badgeId of newBadges) {
          try {
            await ctx.prisma.achievement.create({
              data: { userId: ctx.user.id, badgeId },
            });
          } catch {
            // Ignore duplicate key errors
          }
        }

        if (newBadges.length > 0) {
          const { BADGES } = await import("@/lib/gamification/badges");
          const badgeNames = newBadges
            .map((id) => BADGES[id]?.name)
            .filter(Boolean) as string[];
          notifyBadgeUnlocked(ctx.user.id, badgeNames).catch(() => {});
        }
      }

      const goalProgress = updatedLog.totalCalories / updatedLog.calorieGoal;
      if (!updatedLog.goalMet && goalProgress >= 0.9 && goalProgress <= 1.0) {
        await ctx.prisma.dailyLog.update({
          where: { id: dailyLog.id },
          data: { goalMet: true },
        });
      }

      return { entries: createdEntries, mealGroupId: input.mealGroupId };
    }),

  // Get a single entry by ID
  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/entries/{id}" } })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      return entry;
    }),

  // Get entries for a date
  getByDate: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/entries/by-date" } })
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format") }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const dayStart = new Date(input.date + "T00:00:00.000Z");
      const dayEnd = new Date(input.date + "T23:59:59.999Z");
      const entries = await ctx.prisma.foodEntry.findMany({
        where: {
          userId: ctx.user.id,
          consumedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        orderBy: { consumedAt: "asc" },
      });

      return entries;
    }),

  // Update entry (owner only).
  update: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/food/entries/{id}" } })
    .input(
      z.object({
        id: z.string(),
        data: foodEntrySchema.partial(),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      const calorieDiff = (input.data.calories ?? entry.calories) - entry.calories;
      const proteinDiff = (input.data.protein ?? entry.protein ?? 0) - (entry.protein ?? 0);
      const carbsDiff = (input.data.carbs ?? entry.carbs ?? 0) - (entry.carbs ?? 0);
      const fatDiff = (input.data.fat ?? entry.fat ?? 0) - (entry.fat ?? 0);
      const fiberDiff = (input.data.fiber ?? entry.fiber ?? 0) - (entry.fiber ?? 0);

      const updated = await ctx.prisma.foodEntry.update({
        where: { id: input.id },
        data: input.data,
      });

      if (entry.dailyLogId) {
        const updatedLog = await ctx.prisma.dailyLog.update({
          where: { id: entry.dailyLogId },
          data: {
            totalCalories: { increment: calorieDiff },
            totalProtein: { increment: proteinDiff },
            totalCarbs: { increment: carbsDiff },
            totalFat: { increment: fatDiff },
            totalFiber: { increment: fiberDiff },
          },
        });

        const goalProgress = updatedLog.calorieGoal > 0
          ? updatedLog.totalCalories / updatedLog.calorieGoal
          : 0;
        const newGoalMet = goalProgress >= 0.9 && goalProgress <= 1.0;
        if (updatedLog.goalMet !== newGoalMet) {
          await ctx.prisma.dailyLog.update({
            where: { id: entry.dailyLogId },
            data: { goalMet: newGoalMet },
          });
        }
      }

      return updated;
    }),

  // Delete entry (owner only).
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/food/entries/{id}" } })
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      if (entry.dailyLogId) {
        const updatedLog = await ctx.prisma.dailyLog.update({
          where: { id: entry.dailyLogId },
          data: {
            totalCalories: { decrement: entry.calories },
            totalProtein: { decrement: entry.protein ?? 0 },
            totalCarbs: { decrement: entry.carbs ?? 0 },
            totalFat: { decrement: entry.fat ?? 0 },
            totalFiber: { decrement: entry.fiber ?? 0 },
          },
        });

        const goalProgress = updatedLog.calorieGoal > 0
          ? updatedLog.totalCalories / updatedLog.calorieGoal
          : 0;
        const newGoalMet = goalProgress >= 0.9 && goalProgress <= 1.0;
        if (updatedLog.goalMet !== newGoalMet) {
          await ctx.prisma.dailyLog.update({
            where: { id: entry.dailyLogId },
            data: { goalMet: newGoalMet },
          });
        }
      }

      await ctx.prisma.foodEntry.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get recent unique foods (last 14 days)
  getRecentFoods: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/recent" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Get recent entries grouped by name+brand
    const entries = await ctx.prisma.foodEntry.findMany({
      where: {
        userId: ctx.user.id,
        consumedAt: { gte: fourteenDaysAgo },
      },
      orderBy: { consumedAt: "desc" },
      select: {
        name: true,
        brand: true,
        imageUrl: true,
        barcode: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fiber: true,
        sugar: true,
        sodium: true,
        servingSize: true,
        servingUnit: true,
        consumedAt: true,
        dataSource: true,
        fatSecretId: true,
        openFoodFactsId: true,
        usdaFdcId: true,
      },
    });

    // Get user's favorites for isFavorite flag
    const favorites = await ctx.prisma.favoriteFood.findMany({
      where: { userId: ctx.user.id },
      select: { name: true, brand: true },
    });
    const favoriteSet = new Set(favorites.map((f) => `${f.name}|${f.brand ?? ""}`));

    // Deduplicate by name+brand, keeping most recent
    const seen = new Map<string, (typeof entries)[0]>();
    for (const entry of entries) {
      const key = `${entry.name}|${entry.brand ?? ""}`;
      if (!seen.has(key)) {
        seen.set(key, entry);
      }
    }

    // Convert to QuickAccessFood format (limit to 15)
    const recentFoods = Array.from(seen.values())
      .slice(0, 15)
      .map((entry) => {
        const key = `${entry.name}|${entry.brand ?? ""}`;
        const caloriesPer100g =
          entry.servingSize > 0 ? (entry.calories / entry.servingSize) * 100 : entry.calories;
        return {
          id: entry.fatSecretId
            ? `fs_${entry.fatSecretId}`
            : entry.openFoodFactsId
              ? `off_${entry.openFoodFactsId}`
              : entry.usdaFdcId
                ? `usda_${entry.usdaFdcId}`
                : `manual_${entry.name}`,
          dataSource: entry.dataSource,
          fatSecretId: entry.fatSecretId,
          barcode: entry.barcode,
          fdcId: entry.usdaFdcId,
          name: entry.name,
          brand: entry.brand,
          imageUrl: entry.imageUrl,
          caloriesPer100g: Math.round(caloriesPer100g),
          proteinPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.protein ?? 0) / entry.servingSize) * 100 : 0
          ),
          carbsPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.carbs ?? 0) / entry.servingSize) * 100 : 0
          ),
          fatPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.fat ?? 0) / entry.servingSize) * 100 : 0
          ),
          fiberPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.fiber ?? 0) / entry.servingSize) * 100 : 0
          ),
          sugarPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.sugar ?? 0) / entry.servingSize) * 100 : 0
          ),
          sodiumPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.sodium ?? 0) / entry.servingSize) * 100 : 0
          ),
          servingSize: entry.servingSize,
          servingUnit: entry.servingUnit,
          servingSizeText: `${entry.servingSize}${entry.servingUnit}`,
          lastLoggedAt: entry.consumedAt.toISOString(),
          isFavorite: favoriteSet.has(key),
          defaultServingSize: entry.servingSize,
          defaultServingUnit: entry.servingUnit,
        };
      });

    return recentFoods;
  }),

  // Get frequently logged foods (3+ times in last 30 days)
  getFrequentFoods: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/frequent" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get entries from last 30 days
    const entries = await ctx.prisma.foodEntry.findMany({
      where: {
        userId: ctx.user.id,
        consumedAt: { gte: thirtyDaysAgo },
      },
      select: {
        name: true,
        brand: true,
        imageUrl: true,
        barcode: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fiber: true,
        sugar: true,
        sodium: true,
        servingSize: true,
        servingUnit: true,
        consumedAt: true,
        dataSource: true,
        fatSecretId: true,
        openFoodFactsId: true,
        usdaFdcId: true,
      },
    });

    // Get user's favorites for isFavorite flag
    const favorites = await ctx.prisma.favoriteFood.findMany({
      where: { userId: ctx.user.id },
      select: { name: true, brand: true },
    });
    const favoriteSet = new Set(favorites.map((f) => `${f.name}|${f.brand ?? ""}`));

    // Count occurrences and keep most recent entry per food
    const countMap = new Map<string, { count: number; entry: (typeof entries)[0] }>();
    for (const entry of entries) {
      const key = `${entry.name}|${entry.brand ?? ""}`;
      const existing = countMap.get(key);
      if (existing) {
        existing.count++;
        // Keep most recent
        if (entry.consumedAt > existing.entry.consumedAt) {
          existing.entry = entry;
        }
      } else {
        countMap.set(key, { count: 1, entry });
      }
    }

    // Filter to 3+ occurrences, sort by count desc
    const frequentFoods = Array.from(countMap.entries())
      .filter(([, data]) => data.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([key, { count, entry }]) => {
        const caloriesPer100g =
          entry.servingSize > 0 ? (entry.calories / entry.servingSize) * 100 : entry.calories;
        return {
          id: entry.fatSecretId
            ? `fs_${entry.fatSecretId}`
            : entry.openFoodFactsId
              ? `off_${entry.openFoodFactsId}`
              : entry.usdaFdcId
                ? `usda_${entry.usdaFdcId}`
                : `manual_${entry.name}`,
          dataSource: entry.dataSource,
          fatSecretId: entry.fatSecretId,
          barcode: entry.barcode,
          fdcId: entry.usdaFdcId,
          name: entry.name,
          brand: entry.brand,
          imageUrl: entry.imageUrl,
          caloriesPer100g: Math.round(caloriesPer100g),
          proteinPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.protein ?? 0) / entry.servingSize) * 100 : 0
          ),
          carbsPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.carbs ?? 0) / entry.servingSize) * 100 : 0
          ),
          fatPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.fat ?? 0) / entry.servingSize) * 100 : 0
          ),
          fiberPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.fiber ?? 0) / entry.servingSize) * 100 : 0
          ),
          sugarPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.sugar ?? 0) / entry.servingSize) * 100 : 0
          ),
          sodiumPer100g: Math.round(
            entry.servingSize > 0 ? ((entry.sodium ?? 0) / entry.servingSize) * 100 : 0
          ),
          servingSize: entry.servingSize,
          servingUnit: entry.servingUnit,
          servingSizeText: `${entry.servingSize}${entry.servingUnit}`,
          lastLoggedAt: entry.consumedAt.toISOString(),
          logCount: count,
          isFavorite: favoriteSet.has(key),
          defaultServingSize: entry.servingSize,
          defaultServingUnit: entry.servingUnit,
        };
      });

    return frequentFoods;
  }),

  // Get user's favorite foods
  getFavoriteFoods: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/food/favorites" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const favorites = await ctx.prisma.favoriteFood.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });

    return favorites.map((fav) => ({
      id: fav.fatSecretId
        ? `fs_${fav.fatSecretId}`
        : fav.openFoodFactsId
          ? `off_${fav.openFoodFactsId}`
          : fav.usdaFdcId
            ? `usda_${fav.usdaFdcId}`
            : `manual_${fav.name}`,
      dataSource: fav.dataSource,
      fatSecretId: fav.fatSecretId,
      barcode: fav.barcode,
      fdcId: fav.usdaFdcId,
      name: fav.name,
      brand: fav.brand,
      imageUrl: fav.imageUrl,
      caloriesPer100g: fav.caloriesPer100g,
      proteinPer100g: fav.proteinPer100g,
      carbsPer100g: fav.carbsPer100g,
      fatPer100g: fav.fatPer100g,
      fiberPer100g: fav.fiberPer100g,
      sugarPer100g: fav.sugarPer100g,
      sodiumPer100g: fav.sodiumPer100g,
      servingSize: fav.defaultServingSize,
      servingUnit: fav.defaultServingUnit,
      servingSizeText: `${fav.defaultServingSize}${fav.defaultServingUnit}`,
      isFavorite: true,
      defaultServingSize: fav.defaultServingSize,
      defaultServingUnit: fav.defaultServingUnit,
    }));
  }),

  // Toggle favorite status for a food
  toggleFavorite: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/food/favorites/toggle" } })
    .input(
      z.object({
        name: z.string(),
        brand: z.string().nullable(),
        imageUrl: z.string().nullable(),
        barcode: z.string().nullable(),
        caloriesPer100g: z.number(),
        proteinPer100g: z.number(),
        carbsPer100g: z.number(),
        fatPer100g: z.number(),
        fiberPer100g: z.number().default(0),
        sugarPer100g: z.number().default(0),
        sodiumPer100g: z.number().default(0),
        dataSource: z.enum(["FATSECRET", "MANUAL", "OPEN_FOOD_FACTS", "USDA"]),
        fatSecretId: z.string().nullable().optional(),
        openFoodFactsId: z.string().nullable().optional(),
        usdaFdcId: z.number().nullable().optional(),
        defaultServingSize: z.number().default(100),
        defaultServingUnit: z.string().default("g"),
      })
    )
    .output(z.object({ isFavorite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already favorited
      const existing = await ctx.prisma.favoriteFood.findUnique({
        where: {
          userId_name_brand: {
            userId: ctx.user.id,
            name: input.name,
            brand: input.brand ?? "",
          },
        },
      });

      if (existing) {
        // Remove from favorites
        await ctx.prisma.favoriteFood.delete({
          where: { id: existing.id },
        });
        return { isFavorite: false };
      } else {
        // Add to favorites
        await ctx.prisma.favoriteFood.create({
          data: {
            userId: ctx.user.id,
            name: input.name,
            brand: input.brand,
            imageUrl: input.imageUrl,
            barcode: input.barcode,
            caloriesPer100g: input.caloriesPer100g,
            proteinPer100g: input.proteinPer100g,
            carbsPer100g: input.carbsPer100g,
            fatPer100g: input.fatPer100g,
            fiberPer100g: input.fiberPer100g,
            sugarPer100g: input.sugarPer100g,
            sodiumPer100g: input.sodiumPer100g,
            dataSource: input.dataSource,
            fatSecretId: input.fatSecretId,
            openFoodFactsId: input.openFoodFactsId,
            usdaFdcId: input.usdaFdcId,
            defaultServingSize: input.defaultServingSize,
            defaultServingUnit: input.defaultServingUnit,
          },
        });
        return { isFavorite: true };
      }
    }),

  // Clear search cache for debugging
  clearSearchCache: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/food/clear-search-cache" } })
    .input(
      z.object({
        query: z.string().optional(),
      })
    )
    .output(z.object({ cleared: z.number(), query: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      if (input.query) {
        // Clear specific query cache
        const queryHash = hashQuery(input.query);
        try {
          await ctx.prisma.searchCache.delete({
            where: { queryHash },
          });
          return { cleared: 1, query: input.query };
        } catch {
          // Entry not found, that's okay
          return { cleared: 0, query: input.query };
        }
      } else {
        // Clear all expired entries
        const count = await cleanupExpiredCache();
        return { cleared: count, query: null };
      }
    }),
});
