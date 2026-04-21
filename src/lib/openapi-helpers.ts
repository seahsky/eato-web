import { z, type ZodType } from "zod";

/**
 * Satisfies trpc-to-openapi's requirement that every OpenAPI-annotated procedure
 * have an output schema, while preserving tRPC's TypeScript inference for the
 * caller. The emitted OpenAPI output is permissive (`{}`); tighten by replacing
 * with a real zod schema when the feature is built out on the iOS client.
 */
export function typedAnyOutput<T>(): ZodType<T> {
  return z.any() as unknown as ZodType<T>;
}
