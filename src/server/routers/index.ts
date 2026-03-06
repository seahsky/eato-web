import { router } from "../trpc";
import { authRouter } from "./auth";
import { profileRouter } from "./profile";
import { foodRouter } from "./food";
import { statsRouter } from "./stats";
import { recipeRouter } from "./recipe";
import { notificationRouter } from "./notification";
import { mealEstimationRouter } from "./meal-estimation";
import { achievementsRouter } from "./achievements";
import { healthRouter } from "./health";
import { petRouter } from "./pet";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  profile: profileRouter,
  food: foodRouter,
  stats: statsRouter,
  recipe: recipeRouter,
  notification: notificationRouter,
  mealEstimation: mealEstimationRouter,
  achievements: achievementsRouter,
  pet: petRouter,
});

export type AppRouter = typeof appRouter;
