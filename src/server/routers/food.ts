import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getProductByBarcode, normalizeProduct } from "../services/open-food-facts";
import { getUSDAFoodById, normalizeUSDAProduct } from "../services/usda-food-data";
import { searchFoods } from "../services/food-search";
import { startOfDay, endOfDay } from "date-fns";

const foodEntrySchema = z.object({
  name: z.string().min(1),
  barcode: z.string().optional(),
  brand: z.string().optional(),
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
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  consumedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  isManualEntry: z.boolean().default(false),
  dataSource: z.enum(["OPEN_FOOD_FACTS", "USDA", "MANUAL"]).default("MANUAL"),
  openFoodFactsId: z.string().optional(),
  usdaFdcId: z.number().optional(),
  forPartnerId: z.string().optional(),
});

export const foodRouter = router({
  // Unified search across USDA and Open Food Facts
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      return searchFoods(input.query, input.page);
    }),

  // Get product by barcode (Open Food Facts only)
  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input }) => {
      const product = await getProductByBarcode(input.barcode);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      const normalized = normalizeProduct(product);
      return {
        ...normalized,
        id: `off_${product.code}`,
        dataSource: "OPEN_FOOD_FACTS" as const,
        fdcId: null,
      };
    }),

  // Get USDA food by FDC ID
  getByFdcId: protectedProcedure
    .input(z.object({ fdcId: z.number() }))
    .query(async ({ input }) => {
      const food = await getUSDAFoodById(input.fdcId);
      if (!food) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "USDA food not found",
        });
      }
      return normalizeUSDAProduct(food);
    }),

  // Log food entry
  log: protectedProcedure.input(foodEntrySchema).mutation(async ({ ctx, input }) => {
    const { forPartnerId, ...entryData } = input;
    const isLoggingForPartner = !!forPartnerId;
    let targetUserId = ctx.user.id;

    // Validate partner relationship if logging for partner
    if (isLoggingForPartner) {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { partnerId: true },
      });

      if (user?.partnerId !== forPartnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only log food for your linked partner",
        });
      }
      targetUserId = forPartnerId;
    }

    // Parse YYYY-MM-DD as UTC midnight for consistent date handling across timezones
    const dayStart = new Date(input.consumedAt + "T00:00:00.000Z");
    const consumedAt = new Date(input.consumedAt + "T12:00:00.000Z");

    // Get or create daily log for target user
    let dailyLog = await ctx.prisma.dailyLog.findUnique({
      where: {
        userId_date: {
          userId: targetUserId,
          date: dayStart,
        },
      },
    });

    // Get target user's calorie goal
    const profile = await ctx.prisma.profile.findUnique({
      where: { userId: targetUserId },
    });

    const calorieGoal = profile?.calorieGoal ?? 2000;

    if (!dailyLog) {
      dailyLog = await ctx.prisma.dailyLog.create({
        data: {
          userId: targetUserId,
          date: dayStart,
          calorieGoal,
        },
      });
    }

    // Create food entry
    const entry = await ctx.prisma.foodEntry.create({
      data: {
        userId: targetUserId,
        dailyLogId: dailyLog.id,
        loggedByUserId: isLoggingForPartner ? ctx.user.id : null,
        approvalStatus: isLoggingForPartner ? "PENDING" : "APPROVED",
        ...entryData,
        consumedAt,
      },
    });

    // Only update daily log totals for approved (self-logged) entries
    if (!isLoggingForPartner) {
      await ctx.prisma.dailyLog.update({
        where: { id: dailyLog.id },
        data: {
          totalCalories: { increment: input.calories },
          totalProtein: { increment: input.protein ?? 0 },
          totalCarbs: { increment: input.carbs ?? 0 },
          totalFat: { increment: input.fat ?? 0 },
          totalFiber: { increment: input.fiber ?? 0 },
        },
      });
    }

    return entry;
  }),

  // Get entries for a date
  getByDate: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format") }))
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

  // Update entry
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: foodEntrySchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First find the entry without user restriction
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: { id: input.id },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      // Check permissions:
      // - APPROVED entries: only owner can update
      // - PENDING/REJECTED entries: only the logger can update
      const isOwner = entry.userId === ctx.user.id;
      const isLogger = entry.loggedByUserId === ctx.user.id;

      if (entry.approvalStatus === "APPROVED") {
        if (!isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the owner can update approved entries",
          });
        }
      } else {
        // PENDING or REJECTED
        if (!isLogger) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the person who logged this entry can update it",
          });
        }
      }

      // Calculate difference for updating daily log
      const calorieDiff = (input.data.calories ?? entry.calories) - entry.calories;
      const proteinDiff = (input.data.protein ?? entry.protein ?? 0) - (entry.protein ?? 0);
      const carbsDiff = (input.data.carbs ?? entry.carbs ?? 0) - (entry.carbs ?? 0);
      const fatDiff = (input.data.fat ?? entry.fat ?? 0) - (entry.fat ?? 0);
      const fiberDiff = (input.data.fiber ?? entry.fiber ?? 0) - (entry.fiber ?? 0);

      // Remove forPartnerId from update data if present
      const { forPartnerId, ...updateData } = input.data;

      const updated = await ctx.prisma.foodEntry.update({
        where: { id: input.id },
        data: updateData,
      });

      // Only update daily log for APPROVED entries
      if (entry.approvalStatus === "APPROVED" && entry.dailyLogId) {
        await ctx.prisma.dailyLog.update({
          where: { id: entry.dailyLogId },
          data: {
            totalCalories: { increment: calorieDiff },
            totalProtein: { increment: proteinDiff },
            totalCarbs: { increment: carbsDiff },
            totalFat: { increment: fatDiff },
            totalFiber: { increment: fiberDiff },
          },
        });
      }

      return updated;
    }),

  // Delete entry
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First find the entry without user restriction
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: { id: input.id },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      // Check permissions:
      // - APPROVED entries: only owner can delete
      // - PENDING/REJECTED entries: only the logger can delete
      const isOwner = entry.userId === ctx.user.id;
      const isLogger = entry.loggedByUserId === ctx.user.id;

      if (entry.approvalStatus === "APPROVED") {
        if (!isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the owner can delete approved entries",
          });
        }
      } else {
        // PENDING or REJECTED
        if (!isLogger) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the person who logged this entry can delete it",
          });
        }
      }

      // Only update daily log for APPROVED entries (others don't affect totals)
      if (entry.approvalStatus === "APPROVED" && entry.dailyLogId) {
        await ctx.prisma.dailyLog.update({
          where: { id: entry.dailyLogId },
          data: {
            totalCalories: { decrement: entry.calories },
            totalProtein: { decrement: entry.protein ?? 0 },
            totalCarbs: { decrement: entry.carbs ?? 0 },
            totalFat: { decrement: entry.fat ?? 0 },
            totalFiber: { decrement: entry.fiber ?? 0 },
          },
        });
      }

      await ctx.prisma.foodEntry.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get entries pending current user's approval
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.prisma.foodEntry.findMany({
      where: {
        userId: ctx.user.id,
        approvalStatus: "PENDING",
        loggedByUserId: { not: null },
      },
      orderBy: { loggedAt: "desc" },
    });

    // Get logger names
    const loggerIds = [...new Set(entries.map((e) => e.loggedByUserId).filter(Boolean))] as string[];
    const loggers = await ctx.prisma.user.findMany({
      where: { id: { in: loggerIds } },
      select: { id: true, name: true },
    });
    const loggerMap = new Map(loggers.map((l) => [l.id, l.name]));

    return entries.map((e) => ({
      ...e,
      loggedByName: e.loggedByUserId ? loggerMap.get(e.loggedByUserId) : null,
    }));
  }),

  // Get pending approval count (for badge)
  getPendingApprovalCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.foodEntry.count({
      where: {
        userId: ctx.user.id,
        approvalStatus: "PENDING",
        loggedByUserId: { not: null },
      },
    });
    return { count };
  }),

  // Get entries I logged for partner that are pending/rejected
  getMyPendingSubmissions: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.prisma.foodEntry.findMany({
      where: {
        loggedByUserId: ctx.user.id,
        approvalStatus: { in: ["PENDING", "REJECTED"] },
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { loggedAt: "desc" },
    });
    return entries;
  }),

  // Approve an entry
  approveEntry: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: {
          id: input.entryId,
          userId: ctx.user.id,
          approvalStatus: "PENDING",
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found or already processed",
        });
      }

      // Update entry status
      await ctx.prisma.foodEntry.update({
        where: { id: input.entryId },
        data: { approvalStatus: "APPROVED" },
      });

      // Update daily log totals
      if (entry.dailyLogId) {
        await ctx.prisma.dailyLog.update({
          where: { id: entry.dailyLogId },
          data: {
            totalCalories: { increment: entry.calories },
            totalProtein: { increment: entry.protein ?? 0 },
            totalCarbs: { increment: entry.carbs ?? 0 },
            totalFat: { increment: entry.fat ?? 0 },
            totalFiber: { increment: entry.fiber ?? 0 },
          },
        });
      }

      return { success: true };
    }),

  // Reject an entry
  rejectEntry: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: {
          id: input.entryId,
          userId: ctx.user.id,
          approvalStatus: "PENDING",
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found or already processed",
        });
      }

      await ctx.prisma.foodEntry.update({
        where: { id: input.entryId },
        data: {
          approvalStatus: "REJECTED",
          rejectionNote: input.note,
        },
      });

      return { success: true };
    }),

  // Resubmit a rejected entry
  resubmitEntry: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: {
          id: input.entryId,
          loggedByUserId: ctx.user.id,
          approvalStatus: "REJECTED",
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found or not rejected",
        });
      }

      await ctx.prisma.foodEntry.update({
        where: { id: input.entryId },
        data: {
          approvalStatus: "PENDING",
          rejectionNote: null,
        },
      });

      return { success: true };
    }),

  // Clone meal to partner
  cloneMealToPartner: protectedProcedure
    .input(
      z.object({
        mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If no date provided, use today's date in a timezone-safe way
      const dateStr = input.date ?? new Date().toISOString().split("T")[0];
      const dayStart = new Date(dateStr + "T00:00:00.000Z");
      const dayEnd = new Date(dateStr + "T23:59:59.999Z");

      // Get user with partner info
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: {
          partner: {
            select: { id: true, name: true },
          },
        },
      });

      if (!user?.partner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have a linked partner to clone meals",
        });
      }

      // Get user's approved entries for this meal
      const entries = await ctx.prisma.foodEntry.findMany({
        where: {
          userId: ctx.user.id,
          mealType: input.mealType,
          approvalStatus: "APPROVED",
          consumedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      if (entries.length === 0) {
        return { clonedCount: 0, partnerName: user.partner.name };
      }

      // Get or create partner's daily log
      const partnerProfile = await ctx.prisma.profile.findUnique({
        where: { userId: user.partner.id },
      });
      const calorieGoal = partnerProfile?.calorieGoal ?? 2000;

      let partnerDailyLog = await ctx.prisma.dailyLog.findUnique({
        where: {
          userId_date: {
            userId: user.partner.id,
            date: dayStart,
          },
        },
      });

      if (!partnerDailyLog) {
        partnerDailyLog = await ctx.prisma.dailyLog.create({
          data: {
            userId: user.partner.id,
            date: dayStart,
            calorieGoal,
          },
        });
      }

      // Clone entries for partner
      const clonedEntries = await ctx.prisma.foodEntry.createMany({
        data: entries.map((entry) => ({
          userId: user.partner!.id,
          dailyLogId: partnerDailyLog!.id,
          loggedByUserId: ctx.user.id,
          approvalStatus: "PENDING" as const,
          name: entry.name,
          barcode: entry.barcode,
          brand: entry.brand,
          imageUrl: entry.imageUrl,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          fiber: entry.fiber,
          sugar: entry.sugar,
          sodium: entry.sodium,
          servingSize: entry.servingSize,
          servingUnit: entry.servingUnit,
          mealType: entry.mealType,
          consumedAt: entry.consumedAt,
          isManualEntry: entry.isManualEntry,
          openFoodFactsId: entry.openFoodFactsId,
          recipeId: entry.recipeId,
        })),
      });

      return {
        clonedCount: clonedEntries.count,
        partnerName: user.partner.name,
      };
    }),

  // Get recent unique foods (last 14 days)
  getRecentFoods: protectedProcedure.query(async ({ ctx }) => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Get recent entries grouped by name+brand
    const entries = await ctx.prisma.foodEntry.findMany({
      where: {
        userId: ctx.user.id,
        approvalStatus: "APPROVED",
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
          id: entry.openFoodFactsId
            ? `off_${entry.openFoodFactsId}`
            : entry.usdaFdcId
              ? `usda_${entry.usdaFdcId}`
              : `manual_${entry.name}`,
          dataSource: entry.dataSource,
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
  getFrequentFoods: protectedProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get entries from last 30 days
    const entries = await ctx.prisma.foodEntry.findMany({
      where: {
        userId: ctx.user.id,
        approvalStatus: "APPROVED",
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
          id: entry.openFoodFactsId
            ? `off_${entry.openFoodFactsId}`
            : entry.usdaFdcId
              ? `usda_${entry.usdaFdcId}`
              : `manual_${entry.name}`,
          dataSource: entry.dataSource,
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
  getFavoriteFoods: protectedProcedure.query(async ({ ctx }) => {
    const favorites = await ctx.prisma.favoriteFood.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });

    return favorites.map((fav) => ({
      id: fav.openFoodFactsId
        ? `off_${fav.openFoodFactsId}`
        : fav.usdaFdcId
          ? `usda_${fav.usdaFdcId}`
          : `manual_${fav.name}`,
      dataSource: fav.dataSource,
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
        dataSource: z.enum(["OPEN_FOOD_FACTS", "USDA", "MANUAL"]),
        openFoodFactsId: z.string().nullable(),
        usdaFdcId: z.number().nullable(),
        defaultServingSize: z.number().default(100),
        defaultServingUnit: z.string().default("g"),
      })
    )
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
            openFoodFactsId: input.openFoodFactsId,
            usdaFdcId: input.usdaFdcId,
            defaultServingSize: input.defaultServingSize,
            defaultServingUnit: input.defaultServingUnit,
          },
        });
        return { isFavorite: true };
      }
    }),
});
