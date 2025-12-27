import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import type { FoodProduct, FoodSearchResult } from "@/types/food";
import type { FoodProductCache } from "@prisma/client";

// Minimum local results before falling back to API
const MIN_LOCAL_RESULTS = parseInt(process.env.LOCAL_SEARCH_MIN_RESULTS || "10", 10);

export interface LocalSearchResult {
  products: FoodProduct[];
  totalCount: number;
  fromLocal: boolean;
}

/**
 * Setup MongoDB text indexes for full-text search
 * Run this once during deployment/migration
 */
export async function setupTextIndexes(): Promise<void> {
  console.log("[LocalSearch] Setting up text indexes...");

  try {
    // Create compound text index on name and brand
    await prisma.$runCommandRaw({
      createIndexes: "FoodProductCache",
      indexes: [
        {
          key: { name: "text", brand: "text" },
          name: "food_text_search",
          weights: { name: 10, brand: 5 },
          default_language: "english",
        },
      ],
    });

    console.log("[LocalSearch] Text indexes created successfully");
  } catch (error) {
    // Index might already exist
    if (error instanceof Error && error.message.includes("already exists")) {
      console.log("[LocalSearch] Text indexes already exist");
    } else {
      console.error("[LocalSearch] Failed to create text indexes:", error);
      throw error;
    }
  }
}

/**
 * Search local database using MongoDB text search
 */
export async function searchLocalDatabase(
  query: string,
  page = 1,
  pageSize = 20,
  options: {
    wholeFoodsOnly?: boolean;
    dataSource?: "USDA" | "OPEN_FOOD_FACTS";
  } = {}
): Promise<LocalSearchResult> {
  const { wholeFoodsOnly, dataSource } = options;
  const skip = (page - 1) * pageSize;

  try {
    // Build filter for MongoDB text search
    const filter = {
      $text: { $search: query },
      ...(wholeFoodsOnly && { isWholeFood: true }),
      ...(dataSource && { dataSource }),
    };

    // Execute text search using raw MongoDB query
    const result = await prisma.$runCommandRaw({
      find: "FoodProductCache",
      filter,
      projection: {
        score: { $meta: "textScore" },
        sourceId: 1,
        dataSource: 1,
        barcode: 1,
        fdcId: 1,
        name: 1,
        brand: 1,
        imageUrl: 1,
        caloriesPer100g: 1,
        proteinPer100g: 1,
        carbsPer100g: 1,
        fatPer100g: 1,
        fiberPer100g: 1,
        sugarPer100g: 1,
        sodiumPer100g: 1,
        servingSize: 1,
        servingUnit: 1,
        servingSizeText: 1,
        popularity: 1,
      },
      sort: { score: { $meta: "textScore" }, popularity: -1 },
      skip,
      limit: pageSize,
    } as object);

    // Parse result
    const cursor = result as { cursor?: { firstBatch?: FoodProductCache[] } };
    const products = cursor.cursor?.firstBatch || [];

    // Convert to FoodProduct format
    const normalizedProducts = products.map(normalizeLocalProduct);

    return {
      products: normalizedProducts,
      totalCount: normalizedProducts.length,
      fromLocal: true,
    };
  } catch (error) {
    console.error("[LocalSearch] Text search failed:", error);
    // Return empty result on error
    return { products: [], totalCount: 0, fromLocal: true };
  }
}

/**
 * Update popularity for products that were returned in search results
 */
export async function updatePopularity(sourceIds: string[]): Promise<void> {
  if (sourceIds.length === 0) return;

  try {
    await prisma.foodProductCache.updateMany({
      where: { sourceId: { in: sourceIds } },
      data: {
        popularity: { increment: 1 },
        lastSearchedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[LocalSearch] Failed to update popularity:", error);
  }
}

/**
 * Track a search query that didn't have enough local results
 */
export async function trackSearchDemand(query: string): Promise<void> {
  const normalizedQuery = query.toLowerCase().trim();
  const queryHash = createHash("sha256").update(normalizedQuery).digest("hex");

  try {
    await prisma.searchDemand.upsert({
      where: { queryHash },
      create: {
        query: normalizedQuery,
        queryHash,
        hitCount: 1,
        lastSearched: new Date(),
      },
      update: {
        hitCount: { increment: 1 },
        lastSearched: new Date(),
      },
    });
  } catch (error) {
    console.error("[LocalSearch] Failed to track search demand:", error);
  }
}

/**
 * Check if local search is enabled via feature flag
 */
export function isLocalSearchEnabled(): boolean {
  return process.env.ENABLE_LOCAL_SEARCH === "true";
}

/**
 * Get minimum local results threshold
 */
export function getMinLocalResults(): number {
  return MIN_LOCAL_RESULTS;
}

/**
 * Convert local product to FoodProduct format
 */
function normalizeLocalProduct(product: Partial<FoodProductCache>): FoodProduct {
  return {
    id: product.sourceId || "",
    dataSource: product.dataSource as "FATSECRET" | "MANUAL" | "OPEN_FOOD_FACTS" | "USDA",
    fatSecretId: product.fatSecretId || null,
    barcode: product.barcode || null,
    fdcId: product.fdcId || null,
    name: product.name || "Unknown",
    brand: product.brand || null,
    imageUrl: product.imageUrl || null,
    caloriesPer100g: product.caloriesPer100g || 0,
    proteinPer100g: product.proteinPer100g || 0,
    carbsPer100g: product.carbsPer100g || 0,
    fatPer100g: product.fatPer100g || 0,
    fiberPer100g: product.fiberPer100g || 0,
    sugarPer100g: product.sugarPer100g || 0,
    sodiumPer100g: product.sodiumPer100g || 0,
    servingSize: product.servingSize || 100,
    servingUnit: product.servingUnit || "g",
    servingSizeText: product.servingSizeText || "100g",
  };
}

/**
 * Get statistics about the local food cache
 */
export async function getLocalCacheStats(): Promise<{
  totalProducts: number;
  offProducts: number;
  usdaProducts: number;
  lastScrapeOFF: Date | null;
  lastScrapeUSDA: Date | null;
}> {
  const [totalProducts, offProducts, usdaProducts, offConfig, usdaConfig] = await Promise.all([
    prisma.foodProductCache.count(),
    prisma.foodProductCache.count({ where: { dataSource: "OPEN_FOOD_FACTS" } }),
    prisma.foodProductCache.count({ where: { dataSource: "USDA" } }),
    prisma.scrapeConfig.findUnique({ where: { dataSource: "OPEN_FOOD_FACTS" } }),
    prisma.scrapeConfig.findUnique({ where: { dataSource: "USDA" } }),
  ]);

  return {
    totalProducts,
    offProducts,
    usdaProducts,
    lastScrapeOFF: offConfig?.lastIncrementalSync || null,
    lastScrapeUSDA: usdaConfig?.lastIncrementalSync || null,
  };
}
