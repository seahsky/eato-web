import { searchProducts, normalizeProduct } from "./open-food-facts";
import { searchUSDA, normalizeUSDAProduct } from "./usda-food-data";
import type { FoodProduct, FoodSearchResult } from "@/types/food";

// Keywords that indicate whole/fresh foods (prioritize USDA)
const WHOLE_FOOD_PATTERNS = [
  // Proteins
  /\b(egg|chicken|beef|pork|lamb|fish|salmon|tuna|shrimp|turkey|duck|bacon|sausage|steak|ham)\b/i,
  // Fruits
  /\b(apple|banana|orange|grape|berry|strawberry|blueberry|raspberry|mango|peach|pear|plum|cherry|melon|watermelon|lemon|lime|avocado|kiwi|pineapple|papaya|coconut|fig|date)\b/i,
  // Vegetables
  /\b(lettuce|spinach|kale|broccoli|carrot|tomato|potato|onion|garlic|pepper|cucumber|celery|cabbage|cauliflower|zucchini|squash|mushroom|corn|pea|bean|asparagus|eggplant|beet|radish|turnip)\b/i,
  // Grains & Staples
  /\b(rice|oat|wheat|flour|quinoa|barley|lentil|chickpea|pasta|noodle|bread)\b/i,
  // Dairy basics
  /\b(milk|cheese|yogurt|butter|cream|egg)\b/i,
  // Nuts & Seeds
  /\b(almond|walnut|peanut|cashew|pecan|pistachio|sunflower|chia|flax|hazelnut|macadamia)\b/i,
  // Generic whole food terms
  /\b(raw|fresh|whole|plain|cooked|boiled|baked|grilled|roasted)\b/i,
];

// Keywords that indicate branded/packaged foods (prioritize Open Food Facts)
const BRANDED_FOOD_PATTERNS = [
  // Packaged foods
  /\b(bar|cereal|chips|cookie|cracker|snack|candy|chocolate|soda|drink|juice|protein powder|supplement|granola|muesli)\b/i,
  // Brand indicators
  /\b(brand|organic|gluten.?free|vegan|keto|low.?fat|sugar.?free|diet)\b/i,
  // Processed foods
  /\b(frozen|canned|instant|ready.?to.?eat|microwave|packaged)\b/i,
];

type QueryClassification = "whole_food" | "branded" | "unknown";

function classifyQuery(query: string): QueryClassification {
  const queryLower = query.toLowerCase();

  // Check for whole food indicators
  for (const pattern of WHOLE_FOOD_PATTERNS) {
    if (pattern.test(queryLower)) {
      return "whole_food";
    }
  }

  // Check for branded food indicators
  for (const pattern of BRANDED_FOOD_PATTERNS) {
    if (pattern.test(queryLower)) {
      return "branded";
    }
  }

  return "unknown";
}

function interleaveArrays<T>(arr1: T[], arr2: T[]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(arr1.length, arr2.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < arr1.length) result.push(arr1[i]);
    if (i < arr2.length) result.push(arr2[i]);
  }

  return result;
}

export async function searchFoods(
  query: string,
  page = 1,
  pageSize = 20
): Promise<FoodSearchResult> {
  const classification = classifyQuery(query);

  // Determine which source to prioritize
  const prioritizeUSDA = classification === "whole_food";
  const prioritizeOFF = classification === "branded";

  // Fetch from both sources in parallel
  // Request half from each to merge into pageSize total
  const halfSize = Math.ceil(pageSize / 2);

  const [usdaResult, offResult] = await Promise.allSettled([
    searchUSDA(query, page, halfSize),
    searchProducts(query, page, halfSize),
  ]);

  // Process USDA results
  let usdaProducts: FoodProduct[] = [];
  let usdaCount = 0;
  let usdaError: string | undefined;

  if (usdaResult.status === "fulfilled") {
    usdaProducts = usdaResult.value.foods.map(normalizeUSDAProduct);
    usdaCount = usdaResult.value.totalHits;
  } else {
    usdaError = usdaResult.reason?.message || "USDA search failed";
  }

  // Process Open Food Facts results
  let offProducts: FoodProduct[] = [];
  let offCount = 0;
  let offError: string | undefined;

  if (offResult.status === "fulfilled") {
    offProducts = offResult.value.products.map((p) => ({
      ...normalizeProduct(p),
      id: `off_${p.code}`,
      dataSource: "OPEN_FOOD_FACTS" as const,
      fdcId: null,
    }));
    offCount = offResult.value.count;
  } else {
    offError = offResult.reason?.message || "Open Food Facts search failed";
  }

  // Merge results based on priority
  let mergedProducts: FoodProduct[];

  if (prioritizeUSDA) {
    // USDA first, then OFF
    mergedProducts = [...usdaProducts, ...offProducts];
  } else if (prioritizeOFF) {
    // OFF first, then USDA
    mergedProducts = [...offProducts, ...usdaProducts];
  } else {
    // Interleave results for unknown classification
    mergedProducts = interleaveArrays(usdaProducts, offProducts);
  }

  // Limit to pageSize
  mergedProducts = mergedProducts.slice(0, pageSize);

  return {
    products: mergedProducts,
    totalCount: usdaCount + offCount,
    page,
    hasMore: page * pageSize < usdaCount + offCount,
    sources: {
      usda: { count: usdaCount, error: usdaError },
      openFoodFacts: { count: offCount, error: offError },
    },
  };
}
