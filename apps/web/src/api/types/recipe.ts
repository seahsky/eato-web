import type { FoodDataSource } from './enums'

export interface RecipeIngredient {
  id: string
  name: string
  quantity: number
  unit: string
  isPercentage: boolean
  baseIngredientId: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g: number
  isManualEntry: boolean
  dataSource: FoodDataSource
  fatSecretId: string | null
  sortOrder: number
}

export interface Recipe {
  id: string
  userId: string
  name: string
  description: string | null
  imageUrl: string | null
  yieldWeight: number
  yieldUnit: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g: number
  ingredients: RecipeIngredient[]
  createdAt: string
  updatedAt: string
}

export interface RecipeIngredientInput {
  name: string
  quantity: number
  unit: string
  isPercentage?: boolean
  baseIngredientId?: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g?: number
  isManualEntry?: boolean
  dataSource?: FoodDataSource
  fatSecretId?: string | null
  sortOrder?: number
}

export interface RecipeInput {
  name: string
  description?: string | null
  imageUrl?: string | null
  yieldWeight: number
  yieldUnit?: string
  ingredients: RecipeIngredientInput[]
}

export interface RecipeLogInput {
  recipeId: string
  portionGrams: number
  mealType: string
  consumedAt: string
  forPartnerId?: string | null
}

export interface NutritionPreview {
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g: number
  totalWeight: number
}
