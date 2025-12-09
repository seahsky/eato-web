import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { calculateBMR, calculateTDEE } from "@/lib/bmr";

const profileSchema = z.object({
  age: z.number().min(13).max(120),
  weight: z.number().min(20).max(500),
  height: z.number().min(50).max(300),
  gender: z.enum(["MALE", "FEMALE"]),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHTLY_ACTIVE",
    "MODERATELY_ACTIVE",
    "ACTIVE",
    "VERY_ACTIVE",
  ]),
  calorieGoal: z.number().min(1000).max(10000).optional(),
});

export const profileRouter = router({
  // Get profile
  get: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.profile.findUnique({
      where: { userId: ctx.user.id },
    });
    return profile;
  }),

  // Create or update profile
  upsert: protectedProcedure
    .input(profileSchema)
    .mutation(async ({ ctx, input }) => {
      const bmr = calculateBMR(
        input.weight,
        input.height,
        input.age,
        input.gender
      );
      const tdee = calculateTDEE(bmr, input.activityLevel);
      const calorieGoal = input.calorieGoal ?? tdee;

      const profile = await ctx.prisma.profile.upsert({
        where: { userId: ctx.user.id },
        update: {
          ...input,
          bmr,
          tdee,
          calorieGoal,
        },
        create: {
          userId: ctx.user.id,
          ...input,
          bmr,
          tdee,
          calorieGoal,
        },
      });

      return profile;
    }),

  // Update just the calorie goal
  updateGoal: protectedProcedure
    .input(z.object({ calorieGoal: z.number().min(1000).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.profile.update({
        where: { userId: ctx.user.id },
        data: { calorieGoal: input.calorieGoal },
      });
      return profile;
    }),

  // Calculate BMR preview (without saving)
  calculateBMRPreview: protectedProcedure
    .input(
      z.object({
        age: z.number().min(13).max(120),
        weight: z.number().min(20).max(500),
        height: z.number().min(50).max(300),
        gender: z.enum(["MALE", "FEMALE"]),
        activityLevel: z.enum([
          "SEDENTARY",
          "LIGHTLY_ACTIVE",
          "MODERATELY_ACTIVE",
          "ACTIVE",
          "VERY_ACTIVE",
        ]),
      })
    )
    .query(({ input }) => {
      const bmr = calculateBMR(
        input.weight,
        input.height,
        input.age,
        input.gender
      );
      const tdee = calculateTDEE(bmr, input.activityLevel);
      return { bmr, tdee };
    }),
});
