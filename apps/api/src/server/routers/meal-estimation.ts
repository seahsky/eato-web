import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Zod schema for meal estimation ingredients
const ingredientSchema = z.object({
  rawLine: z.string(),
  ingredientName: z.string(),
  quantity: z.number(),
  unit: z.string(),
  normalizedGrams: z.number(),
  matchedProductId: z.string().nullable(),
  matchedProductName: z.string().nullable(),
  matchedProductBrand: z.string().nullable(),
  dataSource: z.enum(["FATSECRET", "MANUAL", "OPEN_FOOD_FACTS", "USDA"]).nullable(),
  caloriesPer100g: z.number().nullable(),
  proteinPer100g: z.number().nullable(),
  carbsPer100g: z.number().nullable(),
  fatPer100g: z.number().nullable(),
  calories: z.number().default(0),
  protein: z.number().default(0),
  carbs: z.number().default(0),
  fat: z.number().default(0),
  hasMatch: z.boolean(),
  parseError: z.string().nullable(),
  sortOrder: z.number().default(0),
});

// Zod schema for creating a meal estimation
const createEstimationSchema = z.object({
  rawInputText: z.string(),
  name: z.string(),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  totalGrams: z.number(),
  ingredients: z.array(ingredientSchema),
  foodEntryId: z.string().optional(),
});

// Zod schema for updating a meal estimation
const updateEstimationSchema = z.object({
  id: z.string(),
  data: createEstimationSchema,
});

export const mealEstimationRouter = router({
  // Create a new meal estimation
  create: protectedProcedure
    .input(createEstimationSchema)
    .mutation(async ({ ctx, input }) => {
      const estimation = await ctx.prisma.mealEstimation.create({
        data: {
          userId: ctx.user.id,
          rawInputText: input.rawInputText,
          name: input.name,
          totalCalories: input.totalCalories,
          totalProtein: input.totalProtein,
          totalCarbs: input.totalCarbs,
          totalFat: input.totalFat,
          totalGrams: input.totalGrams,
          foodEntryId: input.foodEntryId,
          ingredients: {
            create: input.ingredients.map((ing, index) => ({
              rawLine: ing.rawLine,
              ingredientName: ing.ingredientName,
              quantity: ing.quantity,
              unit: ing.unit,
              normalizedGrams: ing.normalizedGrams,
              matchedProductId: ing.matchedProductId,
              matchedProductName: ing.matchedProductName,
              matchedProductBrand: ing.matchedProductBrand,
              dataSource: ing.dataSource,
              caloriesPer100g: ing.caloriesPer100g,
              proteinPer100g: ing.proteinPer100g,
              carbsPer100g: ing.carbsPer100g,
              fatPer100g: ing.fatPer100g,
              calories: ing.calories,
              protein: ing.protein,
              carbs: ing.carbs,
              fat: ing.fat,
              hasMatch: ing.hasMatch,
              parseError: ing.parseError,
              sortOrder: ing.sortOrder ?? index,
            })),
          },
        },
        include: {
          ingredients: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return estimation;
    }),

  // List user's meal estimations
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;

      const estimations = await ctx.prisma.mealEstimation.findMany({
        where: { userId: ctx.user.id },
        take: limit + 1,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: { ingredients: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (estimations.length > limit) {
        const nextItem = estimations.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: estimations.map((est) => ({
          id: est.id,
          name: est.name,
          totalCalories: est.totalCalories,
          totalProtein: est.totalProtein,
          totalCarbs: est.totalCarbs,
          totalFat: est.totalFat,
          totalGrams: est.totalGrams,
          ingredientCount: est._count.ingredients,
          hasBeenLogged: !!est.foodEntryId,
          createdAt: est.createdAt,
          updatedAt: est.updatedAt,
        })),
        nextCursor,
      };
    }),

  // Get single estimation by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const estimation = await ctx.prisma.mealEstimation.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        include: {
          ingredients: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!estimation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal estimation not found",
        });
      }

      return estimation;
    }),

  // Update meal estimation
  update: protectedProcedure
    .input(updateEstimationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.mealEstimation.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal estimation not found or you don't have permission to edit it",
        });
      }

      // Delete old ingredients and update estimation
      await ctx.prisma.mealEstimationIngredient.deleteMany({
        where: { estimationId: input.id },
      });

      const estimation = await ctx.prisma.mealEstimation.update({
        where: { id: input.id },
        data: {
          rawInputText: input.data.rawInputText,
          name: input.data.name,
          totalCalories: input.data.totalCalories,
          totalProtein: input.data.totalProtein,
          totalCarbs: input.data.totalCarbs,
          totalFat: input.data.totalFat,
          totalGrams: input.data.totalGrams,
          foodEntryId: input.data.foodEntryId,
          ingredients: {
            create: input.data.ingredients.map((ing, index) => ({
              rawLine: ing.rawLine,
              ingredientName: ing.ingredientName,
              quantity: ing.quantity,
              unit: ing.unit,
              normalizedGrams: ing.normalizedGrams,
              matchedProductId: ing.matchedProductId,
              matchedProductName: ing.matchedProductName,
              matchedProductBrand: ing.matchedProductBrand,
              dataSource: ing.dataSource,
              caloriesPer100g: ing.caloriesPer100g,
              proteinPer100g: ing.proteinPer100g,
              carbsPer100g: ing.carbsPer100g,
              fatPer100g: ing.fatPer100g,
              calories: ing.calories,
              protein: ing.protein,
              carbs: ing.carbs,
              fat: ing.fat,
              hasMatch: ing.hasMatch,
              parseError: ing.parseError,
              sortOrder: ing.sortOrder ?? index,
            })),
          },
        },
        include: {
          ingredients: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return estimation;
    }),

  // Update food entry reference after logging
  linkFoodEntry: protectedProcedure
    .input(
      z.object({
        estimationId: z.string(),
        foodEntryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.mealEstimation.findFirst({
        where: { id: input.estimationId, userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal estimation not found",
        });
      }

      const estimation = await ctx.prisma.mealEstimation.update({
        where: { id: input.estimationId },
        data: { foodEntryId: input.foodEntryId },
      });

      return estimation;
    }),

  // Delete meal estimation
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const estimation = await ctx.prisma.mealEstimation.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!estimation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meal estimation not found or you don't have permission to delete it",
        });
      }

      // Delete estimation (cascade deletes ingredients)
      await ctx.prisma.mealEstimation.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
