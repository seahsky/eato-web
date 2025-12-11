import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { FoodProduct, FoodSearchResult } from "@/types/food";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashQuery(query: string): string {
  return crypto.createHash("sha256").update(query.toLowerCase().trim()).digest("hex");
}

export interface CachedSearchResult {
  products: FoodProduct[];
  totalCount: number;
  sources: FoodSearchResult["sources"];
  fromCache: true;
}

export async function getCachedResults(query: string): Promise<CachedSearchResult | null> {
  const hash = hashQuery(query);

  const cached = await prisma.searchCache.findUnique({
    where: { queryHash: hash },
  });

  if (!cached || cached.expiresAt < new Date()) {
    // Cache miss or expired
    if (cached) {
      // Clean up expired entry (fire-and-forget)
      prisma.searchCache.delete({ where: { id: cached.id } }).catch(() => {});
    }
    return null;
  }

  // Increment hit count (fire-and-forget for performance)
  prisma.searchCache
    .update({
      where: { id: cached.id },
      data: { hitCount: { increment: 1 } },
    })
    .catch(() => {});

  return {
    products: cached.results as unknown as FoodProduct[],
    totalCount: cached.totalCount,
    sources: cached.sources as unknown as FoodSearchResult["sources"],
    fromCache: true,
  };
}

export async function cacheResults(query: string, results: FoodSearchResult): Promise<void> {
  const hash = hashQuery(query);
  const normalizedQuery = query.toLowerCase().trim();

  // Cast to Prisma JSON types for storage
  const productsJson = results.products as unknown as Prisma.InputJsonValue;
  const sourcesJson = results.sources as unknown as Prisma.InputJsonValue;

  await prisma.searchCache.upsert({
    where: { queryHash: hash },
    create: {
      queryHash: hash,
      query: normalizedQuery,
      results: productsJson,
      totalCount: results.totalCount,
      sources: sourcesJson,
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    },
    update: {
      results: productsJson,
      totalCount: results.totalCount,
      sources: sourcesJson,
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      hitCount: { increment: 1 },
    },
  });
}

// Clean up expired cache entries (can be called periodically)
export async function cleanupExpiredCache(): Promise<number> {
  const result = await prisma.searchCache.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
