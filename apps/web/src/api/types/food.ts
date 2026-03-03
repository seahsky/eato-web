import type { ApprovalStatus, FoodDataSource, MealType } from './enums'

export interface FoodProduct {
  id: string
  name: string
  brand: string | null
  imageUrl: string | null
  barcode: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g: number
  sugarPer100g: number
  sodiumPer100g: number
  servingSize: number
  servingUnit: string
  dataSource: FoodDataSource
  fatSecretId: string | null
}

export interface FoodEntry {
  id: string
  userId: string
  name: string
  barcode: string | null
  brand: string | null
  imageUrl: string | null
  calories: number
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  sugar: number | null
  sodium: number | null
  servingSize: number
  servingUnit: string
  mealType: MealType
  loggedAt: string
  consumedAt: string
  dailyLogId: string | null
  isManualEntry: boolean
  dataSource: FoodDataSource
  fatSecretId: string | null
  recipeId: string | null
  loggedByUserId: string | null
  approvalStatus: ApprovalStatus
  rejectionNote: string | null
}

export interface FoodEntryInput {
  name: string
  barcode?: string | null
  brand?: string | null
  imageUrl?: string | null
  calories: number
  protein?: number | null
  carbs?: number | null
  fat?: number | null
  fiber?: number | null
  sugar?: number | null
  sodium?: number | null
  servingSize: number
  servingUnit: string
  mealType: MealType
  consumedAt: string
  isManualEntry?: boolean
  dataSource?: FoodDataSource
  fatSecretId?: string | null
  recipeId?: string | null
  forPartnerId?: string | null
}
