/**
 * Unified Food Search Service
 *
 * Provides food search across FatSecret API with caching and translation support.
 */

import { searchProducts } from "./fatsecret";
import { getCachedResults, cacheResults } from "./search-cache";
import { translateToEnglish, mightNeedTranslation } from "./translation";
import {
  searchLocalDatabase,
  updatePopularity,
  trackSearchDemand,
  isLocalSearchEnabled,
  getMinLocalResults,
} from "./local-food-search";
import type { FoodProduct, FoodSearchResult, TranslationInfo } from "@/types/food";

/**
 * Search for foods across all available sources.
 * Flow:
 * 1. Translate query if non-English
 * 2. Check local database cache (if enabled)
 * 3. Check search result cache
 * 4. Query FatSecret API
 * 5. Cache and return results
 */
export async function searchFoods(
  query: string,
  page = 1,
  pageSize = 20
): Promise<FoodSearchResult> {
  // Step 1: Translate if needed
  let searchQuery = query;
  let translationInfo: TranslationInfo | undefined;

  if (mightNeedTranslation(query)) {
    const translation = await translateToEnglish(query);
    if (translation.wasTranslated) {
      searchQuery = translation.translatedText;
      translationInfo = {
        originalQuery: translation.originalText,
        translatedQuery: translation.translatedText,
        detectedLanguage: translation.detectedLang,
        fromCache: translation.fromCache,
      };
    }
  }

  // Step 2: Try local database first (if enabled)
  if (isLocalSearchEnabled()) {
    const localResult = await searchLocalDatabase(searchQuery, page, pageSize, {
      wholeFoodsOnly: false,
    });

    // If we have enough local results, use them
    if (localResult.products.length >= getMinLocalResults()) {
      // Update popularity for returned products
      const sourceIds = localResult.products.map((p) => p.id);
      updatePopularity(sourceIds).catch(console.error);

      return {
        products: localResult.products,
        totalCount: localResult.totalCount,
        page,
        hasMore: localResult.totalCount > page * pageSize,
        sources: {
          fatsecret: { count: 0 },
        },
        translationInfo,
      };
    }

    // Track this query for demand-based scraping
    trackSearchDemand(searchQuery).catch(console.error);
  }

  // Step 3: Check cache (only for page 1, using translated query)
  if (page === 1) {
    const cached = await getCachedResults(searchQuery);
    if (cached) {
      return {
        ...cached,
        page: 1,
        hasMore: cached.totalCount > pageSize,
        translationInfo,
      };
    }
  }

  // Step 4: Query FatSecret API
  let products: FoodProduct[] = [];
  let totalCount = 0;
  let error: string | undefined;

  try {
    const result = await searchProducts(searchQuery, page, pageSize);
    products = result.products;
    totalCount = result.totalCount;
  } catch (err) {
    error = err instanceof Error ? err.message : "FatSecret search failed";
    console.error("FatSecret search error:", err);
  }

  const result: FoodSearchResult = {
    products,
    totalCount,
    page,
    hasMore: page * pageSize < totalCount,
    sources: {
      fatsecret: { count: totalCount, error },
    },
    translationInfo,
  };

  // Step 5: Cache results for page 1 only (fire-and-forget)
  if (page === 1 && products.length > 0) {
    cacheResults(searchQuery, result).catch(console.error);
  }

  return result;
}

/**
 * Fast search - returns cached results immediately if available,
 * otherwise queries FatSecret API directly.
 */
export async function searchFoodsFast(
  query: string,
  pageSize = 20
): Promise<FoodSearchResult & { fromCache?: boolean }> {
  // Step 1: Translate if needed
  let searchQuery = query;
  let translationInfo: TranslationInfo | undefined;

  if (mightNeedTranslation(query)) {
    const translation = await translateToEnglish(query);
    if (translation.wasTranslated) {
      searchQuery = translation.translatedText;
      translationInfo = {
        originalQuery: translation.originalText,
        translatedQuery: translation.translatedText,
        detectedLanguage: translation.detectedLang,
        fromCache: translation.fromCache,
      };
    }
  }

  // Step 2: Check cache first
  const cached = await getCachedResults(searchQuery);
  if (cached) {
    return {
      ...cached,
      page: 1,
      hasMore: cached.totalCount > pageSize,
      translationInfo,
      fromCache: true,
    };
  }

  // Step 3: Query FatSecret API
  let products: FoodProduct[] = [];
  let totalCount = 0;
  let error: string | undefined;

  try {
    const result = await searchProducts(searchQuery, 1, pageSize);
    products = result.products;
    totalCount = result.totalCount;
  } catch (err) {
    error = err instanceof Error ? err.message : "FatSecret search failed";
  }

  return {
    products: products.slice(0, pageSize),
    totalCount,
    page: 1,
    hasMore: totalCount > pageSize,
    sources: {
      fatsecret: { count: totalCount, error },
    },
    translationInfo,
    fromCache: false,
  };
}
