const BASE_URL = "https://world.openfoodfacts.org/api/v2";
const V1_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const USER_AGENT = process.env.OPEN_FOOD_FACTS_USER_AGENT || "Eato/1.0";

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  image_url?: string;
  image_small_url?: string;
  nutriments: {
    "energy-kcal_100g"?: number;
    "energy-kcal_serving"?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
    fiber_100g?: number;
    fiber_serving?: number;
    sugars_100g?: number;
    sugars_serving?: number;
    sodium_100g?: number;
    sodium_serving?: number;
  };
  serving_size?: string;
  serving_quantity?: number;
}

export interface SearchResult {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

export async function searchProducts(
  query: string,
  page = 1,
  pageSize = 20
): Promise<SearchResult> {
  const fields = [
    "code",
    "product_name",
    "brands",
    "image_url",
    "image_small_url",
    "nutriments",
    "serving_size",
    "serving_quantity",
  ].join(",");

  // Use V1 API for full text search support (V2 only supports filtered search)
  // See: https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/
  const response = await fetch(
    `${V1_SEARCH_URL}?search_terms=${encodeURIComponent(query)}&action=process&json=1&page=${page}&page_size=${pageSize}&fields=${fields}`,
    {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search products: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    products: data.products || [],
    count: data.count || 0,
    page: data.page || page,
    page_size: data.page_size || pageSize,
  };
}

export async function getProductByBarcode(
  barcode: string
): Promise<OpenFoodFactsProduct | null> {
  const fields = [
    "code",
    "product_name",
    "brands",
    "image_url",
    "image_small_url",
    "nutriments",
    "serving_size",
    "serving_quantity",
  ].join(",");

  const response = await fetch(
    `${BASE_URL}/product/${barcode}?fields=${fields}`,
    {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 86400 }, // Cache for 24 hours
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.status === 1 ? data.product : null;
}

// Convert Open Food Facts product to our app's format
export function normalizeProduct(product: OpenFoodFactsProduct) {
  const nutriments = product.nutriments;
  const hasServing = !!product.serving_quantity;

  return {
    barcode: product.code,
    name: product.product_name || "Unknown",
    brand: product.brands || null,
    imageUrl: product.image_small_url || product.image_url || null,
    // Per 100g values
    caloriesPer100g: nutriments["energy-kcal_100g"] || 0,
    proteinPer100g: nutriments.proteins_100g || 0,
    carbsPer100g: nutriments.carbohydrates_100g || 0,
    fatPer100g: nutriments.fat_100g || 0,
    fiberPer100g: nutriments.fiber_100g || 0,
    sugarPer100g: nutriments.sugars_100g || 0,
    sodiumPer100g: nutriments.sodium_100g || 0,
    // Serving info
    servingSize: product.serving_quantity || 100,
    servingUnit: hasServing ? "serving" : "g",
    servingSizeText: product.serving_size || "100g",
  };
}
