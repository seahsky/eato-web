import { router } from "../trpc";
import { authRouter } from "./auth";
import { profileRouter } from "./profile";
import { foodRouter } from "./food";
import { statsRouter } from "./stats";
import { recipeRouter } from "./recipe";
import { notificationRouter } from "./notification";

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  food: foodRouter,
  stats: statsRouter,
  recipe: recipeRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
