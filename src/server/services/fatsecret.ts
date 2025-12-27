/**
 * FatSecret Platform API Food Service
 *
 * Provides food search, barcode lookup, and data normalization
 * for the FatSecret food database.
 *
 * API Documentation: https://platform.fatsecret.com/docs/guides
 */

import { getAccessToken } from "./fatsecret-auth";
import type { FoodProduct } from "@/types/food";

const API_BASE_URL = "https://platform.fatsecret.com/rest";

// ============================================
// FatSecret API Response Types
// ============================================

interface FatSecretServing {
  serving_id: string;
  serving_description: string;
  serving_url: string;
  metric_serving_amount?: string; // Decimal as string
  metric_serving_unit?: string; // "g", "ml", "oz"
  number_of_units?: string;
  measurement_description?: string;
  calories?: string;
  carbohydrate?: string;
  protein?: string;
  fat?: string;
  saturated_fat?: string;
  polyunsaturated_fat?: string;
  monounsaturated_fat?: string;
  fiber?: string;
  sugar?: string;
  sodium?: string; // In mg
  potassium?: string;
  cholesterol?: string;
  is_default?: string; // "1" if default serving
}

interface FatSecretFood {
  food_id: string;
  food_name: string;
  food_type: "Brand" | "Generic";
  food_url: string;
  brand_name?: string;
  servings: {
    serving: FatSecretServing | FatSecretServing[];
  };
}

interface FatSecretSearchFood {
  food_id: string;
  food_name: string;
  food_type: "Brand" | "Generic";
  food_url: string;
  brand_name?: string;
  food_description: string; // Compact nutrition summary
  servings?: {
    serving: FatSecretServing | FatSecretServing[];
  };
}

interface FatSecretSearchResponse {
  foods_search?: {
    max_results: string;
    total_results: string;
    page_number: string;
    results?: {
      food: FatSecretSearchFood | FatSecretSearchFood[];
    };
  };
}

interface FatSecretFoodResponse {
  food?: FatSecretFood;
}

interface FatSecretBarcodeResponse {
  food_id?: {
    value: string;
  };
}

// ============================================
// API Request Helpers
// ============================================

/**
 * Make an authenticated request to FatSecret API
 */
async function fatSecretRequest<T>(
  method: string,
  params: Record<string, string> = {}
): Promise<T> {
  const token = await getAccessToken();

  const body = new URLSearchParams({
    method,
    format: "json",
    ...params,
  });

  const response = await fetch(`${API_BASE_URL}/server.api`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`FatSecret API error (${method}):`, response.status, errorText);
    throw new Error(`FatSecret API error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Nutrition Calculation Helpers
// ============================================

/**
 * Parse a string number safely, returning 0 for invalid values
 */
function parseNum(value: string | undefined): number {
  if (!value) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert a nutrient value from serving-based to per-100g
 */
function calculatePer100g(value: number, servingAmountG: number): number {
  if (!servingAmountG || servingAmountG <= 0) return 0;
  return Math.round((value / servingAmountG) * 100 * 10) / 10;
}

/**
 * Get the best serving to use for nutrition data.
 * Prioritizes servings with metric amounts (grams).
 */
function getBestServing(servings: FatSecretServing | FatSecretServing[]): FatSecretServing | null {
  const servingArray = Array.isArray(servings) ? servings : [servings];

  // First, try to find a serving with metric_serving_amount in grams
  const metricServing = servingArray.find(
    (s) => s.metric_serving_amount && s.metric_serving_unit === "g"
  );
  if (metricServing) return metricServing;

  // Fall back to any serving with metric amount
  const anyMetric = servingArray.find((s) => s.metric_serving_amount);
  if (anyMetric) return anyMetric;

  // Last resort: first serving
  return servingArray[0] || null;
}

/**
 * Parse nutrition from food_description string (compact format from search results).
 * Format: "Per 100g - Calories: 52kcal | Fat: 0.17g | Carbs: 13.81g | Protein: 0.26g"
 */
function parseNutritionFromDescription(description: string): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingText: string;
  servingAmount: number;
} {
  const result = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingText: "100g",
    servingAmount: 100,
  };

  // Extract serving info (e.g., "Per 100g" or "Per 1 cup")
  const servingMatch = description.match(/^Per\s+(.+?)\s+-/i);
  if (servingMatch) {
    result.servingText = servingMatch[1];
    // Try to extract grams from serving text
    const gramsMatch = servingMatch[1].match(/(\d+(?:\.\d+)?)\s*g/i);
    if (gramsMatch) {
      result.servingAmount = parseFloat(gramsMatch[1]);
    }
  }

  // Extract nutrient values
  const caloriesMatch = description.match(/Calories:\s*(\d+(?:\.\d+)?)/i);
  if (caloriesMatch) result.calories = parseFloat(caloriesMatch[1]);

  const fatMatch = description.match(/Fat:\s*(\d+(?:\.\d+)?)/i);
  if (fatMatch) result.fat = parseFloat(fatMatch[1]);

  const carbsMatch = description.match(/Carbs:\s*(\d+(?:\.\d+)?)/i);
  if (carbsMatch) result.carbs = parseFloat(carbsMatch[1]);

  const proteinMatch = description.match(/Protein:\s*(\d+(?:\.\d+)?)/i);
  if (proteinMatch) result.protein = parseFloat(proteinMatch[1]);

  return result;
}

// ============================================
// Product Normalization
// ============================================

/**
 * Normalize a FatSecret food to our FoodProduct format
 */
export function normalizeProduct(food: FatSecretFood): FoodProduct {
  const serving = getBestServing(food.servings.serving);

  if (!serving) {
    // No serving data available, return with zeros
    return {
      id: `fs_${food.food_id}`,
      dataSource: "FATSECRET",
      fatSecretId: food.food_id,
      barcode: null,
      fdcId: null,
      name: food.food_name,
      brand: food.brand_name || null,
      imageUrl: null, // Basic tier doesn't include images
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      fiberPer100g: 0,
      sugarPer100g: 0,
      sodiumPer100g: 0,
      servingSize: 100,
      servingUnit: "g",
      servingSizeText: "100g",
    };
  }

  // Get the metric serving amount in grams
  const servingAmountG = parseNum(serving.metric_serving_amount);

  // Parse nutrition values from serving
  const calories = parseNum(serving.calories);
  const protein = parseNum(serving.protein);
  const carbs = parseNum(serving.carbohydrate);
  const fat = parseNum(serving.fat);
  const fiber = parseNum(serving.fiber);
  const sugar = parseNum(serving.sugar);
  const sodiumMg = parseNum(serving.sodium);

  // Convert to per-100g values
  const caloriesPer100g = calculatePer100g(calories, servingAmountG);
  const proteinPer100g = calculatePer100g(protein, servingAmountG);
  const carbsPer100g = calculatePer100g(carbs, servingAmountG);
  const fatPer100g = calculatePer100g(fat, servingAmountG);
  const fiberPer100g = calculatePer100g(fiber, servingAmountG);
  const sugarPer100g = calculatePer100g(sugar, servingAmountG);
  // Sodium: convert from mg to g, then to per-100g
  const sodiumPer100g = calculatePer100g(sodiumMg / 1000, servingAmountG);

  return {
    id: `fs_${food.food_id}`,
    dataSource: "FATSECRET",
    fatSecretId: food.food_id,
    barcode: null,
    fdcId: null,
    name: food.food_name,
    brand: food.brand_name || null,
    imageUrl: null,
    caloriesPer100g,
    proteinPer100g,
    carbsPer100g,
    fatPer100g,
    fiberPer100g,
    sugarPer100g,
    sodiumPer100g,
    servingSize: servingAmountG || 100,
    servingUnit: serving.metric_serving_unit || "g",
    servingSizeText: serving.serving_description || "100g",
  };
}

/**
 * Normalize a search result food (which may have limited data)
 */
function normalizeSearchFood(food: FatSecretSearchFood): FoodProduct {
  // If servings data is available, use the full normalization
  if (food.servings) {
    return normalizeProduct(food as unknown as FatSecretFood);
  }

  // Otherwise, parse from food_description
  const nutrition = parseNutritionFromDescription(food.food_description);

  // If description is per 100g, values are already per-100g
  // Otherwise, we'd need to convert (but FatSecret usually provides per-100g in description)
  const isPer100g = nutrition.servingAmount === 100;

  return {
    id: `fs_${food.food_id}`,
    dataSource: "FATSECRET",
    fatSecretId: food.food_id,
    barcode: null,
    fdcId: null,
    name: food.food_name,
    brand: food.brand_name || null,
    imageUrl: null,
    caloriesPer100g: isPer100g
      ? nutrition.calories
      : calculatePer100g(nutrition.calories, nutrition.servingAmount),
    proteinPer100g: isPer100g
      ? nutrition.protein
      : calculatePer100g(nutrition.protein, nutrition.servingAmount),
    carbsPer100g: isPer100g
      ? nutrition.carbs
      : calculatePer100g(nutrition.carbs, nutrition.servingAmount),
    fatPer100g: isPer100g
      ? nutrition.fat
      : calculatePer100g(nutrition.fat, nutrition.servingAmount),
    fiberPer100g: 0, // Not in description
    sugarPer100g: 0, // Not in description
    sodiumPer100g: 0, // Not in description
    servingSize: nutrition.servingAmount,
    servingUnit: "g",
    servingSizeText: nutrition.servingText,
  };
}

// ============================================
// Public API Functions
// ============================================

export interface SearchResult {
  products: FoodProduct[];
  totalCount: number;
  page: number;
}

/**
 * Search for foods in the FatSecret database
 */
export async function searchProducts(
  query: string,
  page = 1,
  pageSize = 20
): Promise<SearchResult> {
  try {
    const response = await fatSecretRequest<FatSecretSearchResponse>("foods.search.v3", {
      search_expression: query,
      page_number: String(page - 1), // FatSecret uses 0-based pagination
      max_results: String(Math.min(pageSize, 50)), // Max 50 per API docs
    });

    if (!response.foods_search?.results?.food) {
      return { products: [], totalCount: 0, page };
    }

    const foods = response.foods_search.results.food;
    const foodArray = Array.isArray(foods) ? foods : [foods];

    const products = foodArray.map(normalizeSearchFood);

    return {
      products,
      totalCount: parseInt(response.foods_search.total_results, 10) || 0,
      page,
    };
  } catch (error) {
    console.error("FatSecret search error:", error);
    return { products: [], totalCount: 0, page };
  }
}

/**
 * Format a barcode to GTIN-13 format (13 digits, zero-padded)
 */
function formatBarcodeGTIN13(barcode: string): string {
  // Remove any non-digit characters
  const digits = barcode.replace(/\D/g, "");
  // Pad to 13 digits with leading zeros
  return digits.padStart(13, "0");
}

/**
 * Look up a food by barcode (UPC/EAN)
 */
export async function getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  try {
    const formattedBarcode = formatBarcodeGTIN13(barcode);

    // First, get the food_id from the barcode
    const barcodeResponse = await fatSecretRequest<FatSecretBarcodeResponse>(
      "food.find_id_for_barcode",
      { barcode: formattedBarcode }
    );

    if (!barcodeResponse.food_id?.value) {
      return null;
    }

    // Then, get the full food details
    const foodId = barcodeResponse.food_id.value;
    return getProductById(foodId);
  } catch (error) {
    console.error("FatSecret barcode lookup error:", error);
    return null;
  }
}

/**
 * Get full food details by FatSecret food_id
 */
export async function getProductById(foodId: string): Promise<FoodProduct | null> {
  try {
    const response = await fatSecretRequest<FatSecretFoodResponse>("food.get.v4", {
      food_id: foodId,
    });

    if (!response.food) {
      return null;
    }

    return normalizeProduct(response.food);
  } catch (error) {
    console.error("FatSecret food lookup error:", error);
    return null;
  }
}
