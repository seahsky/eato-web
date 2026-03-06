import { type NextRequest } from "next/server";
import { createOpenApiFetchHandler } from "trpc-to-openapi";
import { appRouter } from "@/server/routers";
import { createContext } from "@/server/context";

export const dynamic = "force-dynamic";

const handler = (req: NextRequest) => {
  return createOpenApiFetchHandler({
    endpoint: "/api/rest",
    router: appRouter,
    createContext: () => createContext(),
    req,
  });
};

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
