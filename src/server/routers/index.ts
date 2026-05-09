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
import { friendRouter } from "./friend";
import { circleRouter } from "./circle";
import { mealMomentRouter } from "./meal-moment";

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
  friend: friendRouter,
  circle: circleRouter,
  mealMoment: mealMomentRouter,
});

export type AppRouter = typeof appRouter;
