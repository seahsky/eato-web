import type { FoodDataSource } from "@/types/food";

export interface MealEstimationIngredient {
  id: string;
  estimationId: string;
  rawLine: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  normalizedGrams: number;
  matchedProductId: string | null;
  matchedProductName: string | null;
  matchedProductBrand: string | null;
  dataSource: FoodDataSource | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hasMatch: boolean;
  parseError: string | null;
  sortOrder: number;
}

export interface MealEstimation {
  id: string;
  userId: string;
  rawInputText: string;
  name: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalGrams: number;
  foodEntryId: string | null;
  ingredients: MealEstimationIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MealEstimationListItem {
  id: string;
  name: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalGrams: number;
  ingredientCount: number;
  hasBeenLogged: boolean;
  createdAt: Date;
  updatedAt: Date;
}
