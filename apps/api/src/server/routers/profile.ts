import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { calculateBMR, calculateTDEE } from "@/lib/bmr";

const energyUnitSchema = z.enum(["KCAL", "KJ"]);
const displayModeSchema = z.enum(["QUALITATIVE", "EXACT"]);

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
  energyUnit: energyUnitSchema.optional(),
});

export const profileRouter = router({
  // Get profile
  get: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/profile" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: ctx.user.id },
      });
      return profile;
    }),

  // Create or update profile
  upsert: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/profile" } })
    .input(profileSchema)
    .output(z.any())
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
    .meta({ openapi: { method: "PUT", path: "/profile/goal" } })
    .input(z.object({ calorieGoal: z.number().min(1000).max(10000) }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.profile.update({
        where: { userId: ctx.user.id },
        data: { calorieGoal: input.calorieGoal },
      });
      return profile;
    }),

  // Update energy unit preference
  updateEnergyUnit: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/profile/energy-unit" } })
    .input(z.object({ energyUnit: energyUnitSchema }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.profile.update({
        where: { userId: ctx.user.id },
        data: { energyUnit: input.energyUnit },
      });
      return profile;
    }),

  // Get partner's profile (read-only)
  getPartnerProfile: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/profile/partner" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { partnerId: true },
    });

    if (!user?.partnerId) {
      return null;
    }

    const profile = await ctx.prisma.profile.findUnique({
      where: { userId: user.partnerId },
    });

    const partner = await ctx.prisma.user.findUnique({
      where: { id: user.partnerId },
      select: { name: true },
    });

    if (!profile) {
      return null;
    }

    return {
      partnerName: partner?.name ?? "Partner",
      ...profile,
    };
  }),

  // Calculate BMR preview (without saving)
  calculateBMRPreview: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/profile/calculate-bmr" } })
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
    .output(z.object({ bmr: z.number(), tdee: z.number() }))
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

  // Complete onboarding wizard - creates profile and marks user as onboarded
  completeOnboarding: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/profile/complete-onboarding" } })
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
        calorieGoal: z.number().min(1000).max(10000),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const bmr = calculateBMR(
        input.weight,
        input.height,
        input.age,
        input.gender
      );
      const tdee = calculateTDEE(bmr, input.activityLevel);

      // Create or update profile
      const profile = await ctx.prisma.profile.upsert({
        where: { userId: ctx.user.id },
        update: {
          age: input.age,
          weight: input.weight,
          height: input.height,
          gender: input.gender,
          activityLevel: input.activityLevel,
          bmr,
          tdee,
          calorieGoal: input.calorieGoal,
        },
        create: {
          userId: ctx.user.id,
          age: input.age,
          weight: input.weight,
          height: input.height,
          gender: input.gender,
          activityLevel: input.activityLevel,
          bmr,
          tdee,
          calorieGoal: input.calorieGoal,
        },
      });

      // Mark user as onboarded
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { profileCompleted: true },
      });

      return { profile, bmr, tdee };
    }),

  // Update display mode preference (Qualitative vs Exact)
  updateDisplayMode: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/profile/display-mode" } })
    .input(z.object({ displayMode: displayModeSchema }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.profile.update({
        where: { userId: ctx.user.id },
        data: { displayMode: input.displayMode },
      });
      return profile;
    }),

  // Update weekly budget settings
  updateWeeklyBudget: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/profile/weekly-budget" } })
    .input(
      z.object({
        weeklyCalorieBudget: z.number().min(7000).max(70000).nullable().optional(),
        weekStartDay: z.number().min(0).max(6).optional(),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.profile.update({
        where: { userId: ctx.user.id },
        data: {
          ...(input.weeklyCalorieBudget !== undefined && {
            weeklyCalorieBudget: input.weeklyCalorieBudget,
          }),
          ...(input.weekStartDay !== undefined && {
            weekStartDay: input.weekStartDay,
          }),
        },
      });
      return profile;
    }),
});
