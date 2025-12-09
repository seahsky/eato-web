import "server-only";

import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { createContext } from "@/server/context";

const createCaller = createCallerFactory(appRouter);

export async function serverTrpc() {
  const context = await createContext();
  return createCaller(context);
}
