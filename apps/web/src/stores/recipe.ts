import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Recipe, RecipeInput, RecipeLogInput, NutritionPreview } from '../api/types'
import * as recipeApi from '../api/endpoints/recipe'
import { cacheGet, cacheSet } from '../composables/useCache'

const CACHE_KEY = 'user_recipes'

export const useRecipeStore = defineStore('recipe', () => {
  const recipes = ref<Recipe[]>([])
  const currentRecipe = ref<Recipe | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const nutritionPreview = ref<NutritionPreview | null>(null)

  async function loadRecipes() {
    loading.value = true
    error.value = null

    const cached = await cacheGet<Recipe[]>(CACHE_KEY)
    if (cached) recipes.value = cached

    try {
      const data = await recipeApi.listRecipes()
      recipes.value = data.recipes
      await cacheSet(CACHE_KEY, data.recipes)
    } catch (e: any) {
      if (!cached) error.value = e.message ?? 'Failed to load recipes'
    } finally {
      loading.value = false
    }
  }

  async function loadRecipe(id: string) {
    loading.value = true
    error.value = null
    try {
      currentRecipe.value = await recipeApi.getRecipe(id)
    } catch (e: any) {
      error.value = e.message ?? 'Failed to load recipe'
    } finally {
      loading.value = false
    }
  }

  async function createRecipe(input: RecipeInput): Promise<Recipe | null> {
    saving.value = true
    error.value = null
    try {
      const recipe = await recipeApi.createRecipe(input)
      recipes.value = [recipe, ...recipes.value]
      await cacheSet(CACHE_KEY, recipes.value)
      return recipe
    } catch (e: any) {
      error.value = e.message ?? 'Failed to create recipe'
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe | null> {
    saving.value = true
    error.value = null
    try {
      const recipe = await recipeApi.updateRecipe(id, input)
      const idx = recipes.value.findIndex((r) => r.id === id)
      if (idx >= 0) recipes.value[idx] = recipe
      await cacheSet(CACHE_KEY, recipes.value)
      return recipe
    } catch (e: any) {
      error.value = e.message ?? 'Failed to update recipe'
      return null
    } finally {
      saving.value = false
    }
  }

  async function deleteRecipe(id: string): Promise<boolean> {
    try {
      await recipeApi.deleteRecipe(id)
      recipes.value = recipes.value.filter((r) => r.id !== id)
      await cacheSet(CACHE_KEY, recipes.value)
      return true
    } catch {
      return false
    }
  }

  async function logRecipe(input: RecipeLogInput) {
    saving.value = true
    try {
      await recipeApi.logRecipe(input)
      return true
    } catch {
      return false
    } finally {
      saving.value = false
    }
  }

  async function previewNutrition(input: Omit<RecipeInput, 'name'>) {
    try {
      nutritionPreview.value = await recipeApi.previewRecipeNutrition(input)
    } catch {
      nutritionPreview.value = null
    }
  }

  return {
    recipes, currentRecipe, loading, saving, error, nutritionPreview,
    loadRecipes, loadRecipe, createRecipe, updateRecipe, deleteRecipe,
    logRecipe, previewNutrition,
  }
})
