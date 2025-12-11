import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { calculateBMR, calculateTDEE } from "@/lib/bmr";

const energyUnitSchema = z.enum(["KCAL", "KJ"]);

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

  // Update energy unit preference
  updateEnergyUnit: protectedProcedure
    .input(z.object({ energyUnit: energyUnitSchema }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.profile.update({
        where: { userId: ctx.user.id },
        data: { energyUnit: input.energyUnit },
      });
      return profile;
    }),

  // Get partner's profile (read-only)
  getPartnerProfile: protectedProcedure.query(async ({ ctx }) => {
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
