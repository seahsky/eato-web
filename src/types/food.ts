// Primary sources: FATSECRET for API, MANUAL for user entries
// Legacy sources kept for backward compatibility with existing data
export type FoodDataSource = "FATSECRET" | "MANUAL" | "OPEN_FOOD_FACTS" | "USDA";

export interface FoodProduct {
  id: string; // Unique: "fs_{food_id}" for FatSecret, "manual_{name}" for manual
  dataSource: FoodDataSource;
  fatSecretId: string | null; // FatSecret food_id
  barcode: string | null; // For barcode lookups
  fdcId: number | null; // USDA only (deprecated, kept for existing data)
  name: string;
  brand: string | null;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
  sodiumPer100g: number;
  servingSize: number;
  servingUnit: string;
  servingSizeText: string;
}

export interface TranslationInfo {
  originalQuery: string;
  translatedQuery: string;
  detectedLanguage: string;
  fromCache: boolean;
}

export interface FoodSearchResult {
  products: FoodProduct[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  sources: {
    fatsecret: { count: number; error?: string };
  };
  translationInfo?: TranslationInfo;
}

// Quick-access food for Recent/Favorites/Frequent tabs
export interface QuickAccessFood extends FoodProduct {
  lastLoggedAt?: string; // ISO date string
  logCount?: number;
  isFavorite: boolean;
  defaultServingSize: number;
  defaultServingUnit: string;
}
