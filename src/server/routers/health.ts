import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const healthRouter = router({
  check: publicProcedure
    .meta({ openapi: { method: "GET", path: "/health" } })
    .input(z.void())
    .output(
      z.object({
        status: z.string(),
        timestamp: z.string(),
      })
    )
    .query(() => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    })),
});
