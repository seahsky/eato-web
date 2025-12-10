import type { FoodProduct } from "@/types/food";

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// USDA Nutrient IDs
const NUTRIENT_IDS = {
  ENERGY: 208, // Energy (kcal)
  PROTEIN: 203, // Protein
  FAT: 204, // Total lipid (fat)
  CARBS: 205, // Carbohydrate
  FIBER: 291, // Fiber, total dietary
  SUGAR: 269, // Sugars, total
  SODIUM: 307, // Sodium (in mg)
};

interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  ingredients?: string;
  foodNutrients: USDANutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
}

interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

// In-memory cache
const searchCache = new Map<string, { data: USDASearchResponse; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(query: string, page: number, pageSize: number): string {
  return `${query.toLowerCase()}_${page}_${pageSize}`;
}

export async function searchUSDA(
  query: string,
  page = 1,
  pageSize = 10
): Promise<{ foods: USDAFood[]; totalHits: number }> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.warn("USDA_API_KEY not set, skipping USDA search");
    return { foods: [], totalHits: 0 };
  }

  // Check cache
  const cacheKey = getCacheKey(query, page, pageSize);
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { foods: cached.data.foods || [], totalHits: cached.data.totalHits || 0 };
  }

  try {
    const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        dataType: ["Foundation", "SR Legacy"], // Whole/fresh foods only
        pageSize,
        pageNumber: page,
        sortBy: "dataType.keyword",
        sortOrder: "asc",
      }),
    });

    if (!response.ok) {
      console.error(`USDA API error: ${response.status} ${response.statusText}`);
      return { foods: [], totalHits: 0 };
    }

    const data: USDASearchResponse = await response.json();

    // Cache the result
    searchCache.set(cacheKey, { data, timestamp: Date.now() });

    return { foods: data.foods || [], totalHits: data.totalHits || 0 };
  } catch (error) {
    console.error("USDA search error:", error);
    return { foods: [], totalHits: 0 };
  }
}

export async function getUSDAFoodById(fdcId: number): Promise<USDAFood | null> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.warn("USDA_API_KEY not set");
    return null;
  }

  try {
    const response = await fetch(`${USDA_BASE_URL}/food/${fdcId}?api_key=${apiKey}`);

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("USDA food lookup error:", error);
    return null;
  }
}

function getNutrientValue(nutrients: USDANutrient[], nutrientId: number): number {
  const nutrient = nutrients.find((n) => n.nutrientId === nutrientId);
  return nutrient?.value ?? 0;
}

export function normalizeUSDAProduct(food: USDAFood): FoodProduct {
  const nutrients = food.foodNutrients;

  // Sodium is in mg, convert to g for consistency with our format
  const sodiumMg = getNutrientValue(nutrients, NUTRIENT_IDS.SODIUM);

  return {
    id: `usda_${food.fdcId}`,
    dataSource: "USDA",
    barcode: null,
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandOwner || null,
    imageUrl: null, // USDA doesn't provide images
    caloriesPer100g: getNutrientValue(nutrients, NUTRIENT_IDS.ENERGY),
    proteinPer100g: getNutrientValue(nutrients, NUTRIENT_IDS.PROTEIN),
    carbsPer100g: getNutrientValue(nutrients, NUTRIENT_IDS.CARBS),
    fatPer100g: getNutrientValue(nutrients, NUTRIENT_IDS.FAT),
    fiberPer100g: getNutrientValue(nutrients, NUTRIENT_IDS.FIBER),
    sugarPer100g: getNutrientValue(nutrients, NUTRIENT_IDS.SUGAR),
    sodiumPer100g: sodiumMg / 1000, // Convert mg to g
    servingSize: food.servingSize || 100,
    servingUnit: food.servingSizeUnit || "g",
    servingSizeText: food.servingSize
      ? `${food.servingSize}${food.servingSizeUnit || "g"}`
      : "100g",
  };
}
