export type FoodDataSource = "OPEN_FOOD_FACTS" | "USDA" | "MANUAL";

export interface FoodProduct {
  id: string; // Unique: "usda_123" or "off_barcode"
  dataSource: FoodDataSource;
  barcode: string | null; // OFF only
  fdcId: number | null; // USDA only
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

export interface FoodSearchResult {
  products: FoodProduct[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  sources: {
    usda: { count: number; error?: string };
    openFoodFacts: { count: number; error?: string };
  };
}
