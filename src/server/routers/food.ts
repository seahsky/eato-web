import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  searchProducts,
  getProductByBarcode,
  normalizeProduct,
} from "../services/open-food-facts";
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
  consumedAt: z.string().datetime(),
  isManualEntry: z.boolean().default(false),
  openFoodFactsId: z.string().optional(),
});

export const foodRouter = router({
  // Search Open Food Facts
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      const result = await searchProducts(input.query, input.page);
      return {
        products: result.products.map(normalizeProduct),
        count: result.count,
        page: result.page,
        hasMore: result.page * 20 < result.count,
      };
    }),

  // Get product by barcode
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
      return normalizeProduct(product);
    }),

  // Log food entry
  log: protectedProcedure.input(foodEntrySchema).mutation(async ({ ctx, input }) => {
    const consumedAt = new Date(input.consumedAt);
    const dayStart = startOfDay(consumedAt);

    // Get or create daily log
    let dailyLog = await ctx.prisma.dailyLog.findUnique({
      where: {
        userId_date: {
          userId: ctx.user.id,
          date: dayStart,
        },
      },
    });

    // Get user's calorie goal
    const profile = await ctx.prisma.profile.findUnique({
      where: { userId: ctx.user.id },
    });

    const calorieGoal = profile?.calorieGoal ?? 2000;

    if (!dailyLog) {
      dailyLog = await ctx.prisma.dailyLog.create({
        data: {
          userId: ctx.user.id,
          date: dayStart,
          calorieGoal,
        },
      });
    }

    // Create food entry
    const entry = await ctx.prisma.foodEntry.create({
      data: {
        userId: ctx.user.id,
        dailyLogId: dailyLog.id,
        ...input,
        consumedAt,
      },
    });

    // Update daily log totals
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

    return entry;
  }),

  // Get entries for a date
  getByDate: protectedProcedure
    .input(z.object({ date: z.string().datetime() }))
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      const entries = await ctx.prisma.foodEntry.findMany({
        where: {
          userId: ctx.user.id,
          consumedAt: {
            gte: startOfDay(date),
            lte: endOfDay(date),
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
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      // Calculate difference for updating daily log
      const calorieDiff = (input.data.calories ?? entry.calories) - entry.calories;
      const proteinDiff = (input.data.protein ?? entry.protein ?? 0) - (entry.protein ?? 0);
      const carbsDiff = (input.data.carbs ?? entry.carbs ?? 0) - (entry.carbs ?? 0);
      const fatDiff = (input.data.fat ?? entry.fat ?? 0) - (entry.fat ?? 0);
      const fiberDiff = (input.data.fiber ?? entry.fiber ?? 0) - (entry.fiber ?? 0);

      const updated = await ctx.prisma.foodEntry.update({
        where: { id: input.id },
        data: input.data,
      });

      // Update daily log if entry has one
      if (entry.dailyLogId) {
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
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      // Update daily log before deleting
      if (entry.dailyLogId) {
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
});
