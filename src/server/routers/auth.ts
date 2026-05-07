import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const userOutputSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  profileCompleted: z.boolean(),
  profile: z.object({
    id: z.string(),
    age: z.number(),
    weight: z.number(),
    height: z.number(),
    gender: z.string(),
    activityLevel: z.string(),
    bmr: z.number(),
    tdee: z.number(),
    calorieGoal: z.number(),
  }).passthrough().nullable(),
}).passthrough().nullable();

export const authRouter = router({
  // Get current user with profile.
  getMe: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/auth/me" } })
    .input(z.void())
    .output(userOutputSchema)
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { profile: true },
      });

      return user;
    }),
});
