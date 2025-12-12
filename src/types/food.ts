export type FoodDataSource = "OPEN_FOOD_FACTS" | "USDA" | "MANUAL";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
export type ApprovalStatus = "APPROVED" | "PENDING" | "REJECTED";

// Matches Prisma FoodEntry model
export interface FoodEntry {
  id: string;
  userId: string;
  name: string;
  barcode: string | null;
  brand: string | null;
  imageUrl: string | null;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  servingSize: number;
  servingUnit: string;
  mealType: MealType;
  loggedAt: Date | string;
  consumedAt: Date | string;
  dailyLogId: string | null;
  isManualEntry: boolean;
  dataSource: FoodDataSource;
  openFoodFactsId: string | null;
  usdaFdcId: number | null;
  recipeId: string | null;
  loggedByUserId: string | null;
  approvalStatus: ApprovalStatus;
  rejectionNote: string | null;
}

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
    usda: { count: number; error?: string };
    openFoodFacts: { count: number; error?: string };
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
