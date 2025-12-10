import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { startOfDay } from "date-fns";
import {
  calculateRecipeNutrition,
  calculatePortionNutrition,
  type IngredientInput,
} from "@/lib/recipe-calculator";

// Zod schema for recipe ingredients
const ingredientSchema = z.object({
  id: z.string().optional(), // Client-side ID for UI management
  name: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.enum(["g", "kg", "ml", "L", "%"]),
  isPercentage: z.boolean().default(false),
  baseIngredientId: z.string().optional().nullable(),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0).default(0),
  carbsPer100g: z.number().min(0).default(0),
  fatPer100g: z.number().min(0).default(0),
  fiberPer100g: z.number().min(0).default(0),
  isManualEntry: z.boolean().default(false),
  openFoodFactsId: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
});

// Zod schema for creating a recipe
const createRecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  yieldWeight: z.number().min(1),
  yieldUnit: z.string().default("g"),
  ingredients: z.array(ingredientSchema).min(1),
});

// Zod schema for logging a recipe portion
const logRecipeSchema = z.object({
  recipeId: z.string(),
  consumedWeight: z.number().min(0),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  consumedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const recipeRouter = router({
  // Create a new recipe
  create: protectedProcedure
    .input(createRecipeSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate percentage ingredients have valid base references
      const percentageIngredients = input.ingredients.filter((i) => i.isPercentage);
      for (const ing of percentageIngredients) {
        if (!ing.baseIngredientId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Percentage ingredient "${ing.name}" must have a base ingredient`,
          });
        }
        const baseExists = input.ingredients.some(
          (i) => i.id === ing.baseIngredientId && !i.isPercentage
        );
        if (!baseExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Base ingredient for "${ing.name}" not found or is also a percentage`,
          });
        }
      }

      // Calculate per-100g nutrition
      const ingredientsForCalc: IngredientInput[] = input.ingredients.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        isPercentage: i.isPercentage,
        baseIngredientId: i.baseIngredientId,
        caloriesPer100g: i.caloriesPer100g,
        proteinPer100g: i.proteinPer100g,
        carbsPer100g: i.carbsPer100g,
        fatPer100g: i.fatPer100g,
        fiberPer100g: i.fiberPer100g,
      }));

      const nutrition = calculateRecipeNutrition(ingredientsForCalc, input.yieldWeight);

      // Create recipe with ingredients
      const recipe = await ctx.prisma.recipe.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          yieldWeight: input.yieldWeight,
          yieldUnit: input.yieldUnit,
          ...nutrition,
          ingredients: {
            create: input.ingredients.map((ing, index) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              isPercentage: ing.isPercentage,
              baseIngredientId: ing.baseIngredientId,
              caloriesPer100g: ing.caloriesPer100g,
              proteinPer100g: ing.proteinPer100g,
              carbsPer100g: ing.carbsPer100g,
              fatPer100g: ing.fatPer100g,
              fiberPer100g: ing.fiberPer100g,
              isManualEntry: ing.isManualEntry,
              openFoodFactsId: ing.openFoodFactsId,
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

      return recipe;
    }),

  // Get all recipes (user's + partner's)
  list: protectedProcedure.query(async ({ ctx }) => {
    // Get user's recipes
    const userRecipes = await ctx.prisma.recipe.findMany({
      where: { userId: ctx.user.id },
      include: {
        ingredients: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get partner's recipes if linked
    let partnerRecipes: typeof userRecipes = [];
    if (ctx.user.partnerId) {
      partnerRecipes = await ctx.prisma.recipe.findMany({
        where: { userId: ctx.user.partnerId },
        include: {
          ingredients: {
            orderBy: { sortOrder: "asc" },
          },
          user: {
            select: { name: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    return {
      userRecipes,
      partnerRecipes,
    };
  }),

  // Get single recipe by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.prisma.recipe.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.user.id },
            { userId: ctx.user.partnerId ?? "" },
          ],
        },
        include: {
          ingredients: {
            orderBy: { sortOrder: "asc" },
          },
          user: {
            select: { id: true, name: true },
          },
        },
      });

      if (!recipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found",
        });
      }

      return {
        ...recipe,
        isOwner: recipe.userId === ctx.user.id,
      };
    }),

  // Update recipe
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: createRecipeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.recipe.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found or you don't have permission to edit it",
        });
      }

      // Validate percentage ingredients
      const percentageIngredients = input.data.ingredients.filter((i) => i.isPercentage);
      for (const ing of percentageIngredients) {
        if (!ing.baseIngredientId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Percentage ingredient "${ing.name}" must have a base ingredient`,
          });
        }
        const baseExists = input.data.ingredients.some(
          (i) => i.id === ing.baseIngredientId && !i.isPercentage
        );
        if (!baseExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Base ingredient for "${ing.name}" not found or is also a percentage`,
          });
        }
      }

      // Recalculate nutrition
      const ingredientsForCalc: IngredientInput[] = input.data.ingredients.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        isPercentage: i.isPercentage,
        baseIngredientId: i.baseIngredientId,
        caloriesPer100g: i.caloriesPer100g,
        proteinPer100g: i.proteinPer100g,
        carbsPer100g: i.carbsPer100g,
        fatPer100g: i.fatPer100g,
        fiberPer100g: i.fiberPer100g,
      }));

      const nutrition = calculateRecipeNutrition(ingredientsForCalc, input.data.yieldWeight);

      // Delete old ingredients and update recipe
      await ctx.prisma.recipeIngredient.deleteMany({
        where: { recipeId: input.id },
      });

      const recipe = await ctx.prisma.recipe.update({
        where: { id: input.id },
        data: {
          name: input.data.name,
          description: input.data.description,
          imageUrl: input.data.imageUrl,
          yieldWeight: input.data.yieldWeight,
          yieldUnit: input.data.yieldUnit,
          ...nutrition,
          ingredients: {
            create: input.data.ingredients.map((ing, index) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              isPercentage: ing.isPercentage,
              baseIngredientId: ing.baseIngredientId,
              caloriesPer100g: ing.caloriesPer100g,
              proteinPer100g: ing.proteinPer100g,
              carbsPer100g: ing.carbsPer100g,
              fatPer100g: ing.fatPer100g,
              fiberPer100g: ing.fiberPer100g,
              isManualEntry: ing.isManualEntry,
              openFoodFactsId: ing.openFoodFactsId,
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

      return recipe;
    }),

  // Delete recipe
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const recipe = await ctx.prisma.recipe.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!recipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found or you don't have permission to delete it",
        });
      }

      // Delete recipe (cascade deletes ingredients)
      await ctx.prisma.recipe.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Log a portion of a recipe as a food entry
  log: protectedProcedure
    .input(logRecipeSchema)
    .mutation(async ({ ctx, input }) => {
      // Get recipe (allow logging partner's recipes)
      const recipe = await ctx.prisma.recipe.findFirst({
        where: {
          id: input.recipeId,
          OR: [
            { userId: ctx.user.id },
            { userId: ctx.user.partnerId ?? "" },
          ],
        },
      });

      if (!recipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found",
        });
      }

      // Calculate portion nutrition
      const portionNutrition = calculatePortionNutrition(
        {
          caloriesPer100g: recipe.caloriesPer100g,
          proteinPer100g: recipe.proteinPer100g,
          carbsPer100g: recipe.carbsPer100g,
          fatPer100g: recipe.fatPer100g,
          fiberPer100g: recipe.fiberPer100g,
        },
        input.consumedWeight
      );

      // Parse YYYY-MM-DD as UTC midnight for consistent date handling across timezones
      const dayStart = new Date(input.consumedAt + "T00:00:00.000Z");
      const consumedAt = new Date(input.consumedAt + "T12:00:00.000Z");

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

      // Create food entry from recipe
      const entry = await ctx.prisma.foodEntry.create({
        data: {
          userId: ctx.user.id,
          dailyLogId: dailyLog.id,
          name: recipe.name,
          imageUrl: recipe.imageUrl,
          calories: portionNutrition.calories,
          protein: portionNutrition.protein,
          carbs: portionNutrition.carbs,
          fat: portionNutrition.fat,
          fiber: portionNutrition.fiber,
          servingSize: input.consumedWeight,
          servingUnit: "g",
          mealType: input.mealType,
          consumedAt,
          isManualEntry: false,
          recipeId: recipe.id,
        },
      });

      // Update daily log totals
      await ctx.prisma.dailyLog.update({
        where: { id: dailyLog.id },
        data: {
          totalCalories: { increment: portionNutrition.calories },
          totalProtein: { increment: portionNutrition.protein },
          totalCarbs: { increment: portionNutrition.carbs },
          totalFat: { increment: portionNutrition.fat },
          totalFiber: { increment: portionNutrition.fiber },
        },
      });

      return entry;
    }),

  // Search recipes by name
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const recipes = await ctx.prisma.recipe.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { userId: ctx.user.partnerId ?? "" },
          ],
          name: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return recipes.map((recipe) => ({
        ...recipe,
        isOwner: recipe.userId === ctx.user.id,
      }));
    }),

  // Preview nutrition calculation (for recipe builder UI)
  previewNutrition: protectedProcedure
    .input(
      z.object({
        ingredients: z.array(ingredientSchema),
        yieldWeight: z.number().min(1),
      })
    )
    .query(async ({ input }) => {
      const ingredientsForCalc: IngredientInput[] = input.ingredients.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        isPercentage: i.isPercentage,
        baseIngredientId: i.baseIngredientId,
        caloriesPer100g: i.caloriesPer100g,
        proteinPer100g: i.proteinPer100g,
        carbsPer100g: i.carbsPer100g,
        fatPer100g: i.fatPer100g,
        fiberPer100g: i.fiberPer100g,
      }));

      return calculateRecipeNutrition(ingredientsForCalc, input.yieldWeight);
    }),
});
