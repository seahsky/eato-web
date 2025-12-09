import { router } from "../trpc";
import { authRouter } from "./auth";
import { profileRouter } from "./profile";
import { foodRouter } from "./food";
import { statsRouter } from "./stats";

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  food: foodRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
