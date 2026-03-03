import api from '../client'
import type { Recipe, RecipeInput, RecipeLogInput, NutritionPreview, FoodEntry } from '../types'

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const { data } = await api.post<Recipe>('/recipes', input)
  return data
}

export async function listRecipes(): Promise<{ recipes: Recipe[] }> {
  const { data } = await api.get<{ recipes: Recipe[] }>('/recipes')
  return data
}

export async function getRecipe(id: string): Promise<Recipe> {
  const { data } = await api.get<Recipe>(`/recipes/${id}`)
  return data
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe> {
  const { data } = await api.put<Recipe>(`/recipes/${id}`, { id, data: input })
  return data
}

export async function deleteRecipe(id: string): Promise<void> {
  await api.delete(`/recipes/${id}`)
}

export async function logRecipe(input: RecipeLogInput): Promise<FoodEntry> {
  const { data } = await api.post<FoodEntry>('/recipes/log', input)
  return data
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const { data } = await api.get<Recipe[]>('/recipes/search', { params: { query } })
  return data
}

export async function getRecentRecipes(limit = 5): Promise<Recipe[]> {
  const { data } = await api.get<Recipe[]>('/recipes/recent', { params: { limit } })
  return data
}

export async function previewRecipeNutrition(input: Omit<RecipeInput, 'name'>): Promise<NutritionPreview> {
  const { data } = await api.post<NutritionPreview>('/recipes/preview-nutrition', input)
  return data
}
