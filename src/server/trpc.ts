import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type OpenApiMeta } from "trpc-to-openapi";
import { type Context } from "./context";

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Middleware for protected routes - requires Clerk auth AND database user
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId || !ctx.dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      user: ctx.dbUser, // Database user with all relations
    },
  });
});
