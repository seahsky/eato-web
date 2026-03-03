import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FoodProduct, FoodEntryInput } from '../api/types'
import { MealType, FoodDataSource } from '../api/types'
import * as foodApi from '../api/endpoints/food'
import { useDashboardStore } from './dashboard'

export const useFoodStore = defineStore('food', () => {
  // Search state
  const query = ref('')
  const results = ref<FoodProduct[]>([])
  const searching = ref(false)
  const searchError = ref<string | null>(null)
  const recentSearches = ref<string[]>([])

  // Entry form state
  const selectedProduct = ref<FoodProduct | null>(null)
  const mealType = ref<MealType>(MealType.BREAKFAST)
  const servingSize = ref(100)
  const servingUnit = ref('g')
  const saving = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function search(q: string) {
    query.value = q
    if (debounceTimer) clearTimeout(debounceTimer)

    if (!q.trim()) {
      results.value = []
      searching.value = false
      return
    }

    searching.value = true
    debounceTimer = setTimeout(() => executeSearch(q), 300)
  }

  async function executeSearch(q: string) {
    try {
      results.value = await foodApi.searchFood(q)
      searchError.value = null
      if (results.value.length > 0 && !recentSearches.value.includes(q)) {
        recentSearches.value = [q, ...recentSearches.value.slice(0, 9)]
      }
    } catch (e: any) {
      searchError.value = e.message ?? 'Search failed'
    } finally {
      searching.value = false
    }
  }

  async function searchByBarcode(barcode: string): Promise<FoodProduct | null> {
    searching.value = true
    searchError.value = null
    try {
      const product = await foodApi.getFoodByBarcode(barcode)
      searching.value = false
      return product
    } catch (e: any) {
      searchError.value = e.message ?? 'Barcode lookup failed'
      searching.value = false
      return null
    }
  }

  function selectProduct(product: FoodProduct) {
    selectedProduct.value = product
    servingSize.value = product.servingSize
    servingUnit.value = product.servingUnit
  }

  function calculatedNutrition() {
    const p = selectedProduct.value
    if (!p) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    const factor = servingSize.value / 100
    return {
      calories: Math.round(p.caloriesPer100g * factor),
      protein: Math.round(p.proteinPer100g * factor * 10) / 10,
      carbs: Math.round(p.carbsPer100g * factor * 10) / 10,
      fat: Math.round(p.fatPer100g * factor * 10) / 10,
      fiber: Math.round(p.fiberPer100g * factor * 10) / 10,
    }
  }

  async function saveEntry(consumedAt: string, forPartnerId?: string): Promise<boolean> {
    const p = selectedProduct.value
    if (!p) return false

    saving.value = true
    const nutrition = calculatedNutrition()

    try {
      const input: FoodEntryInput = {
        name: p.name,
        barcode: p.barcode,
        brand: p.brand,
        imageUrl: p.imageUrl,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber,
        servingSize: servingSize.value,
        servingUnit: servingUnit.value,
        mealType: mealType.value,
        consumedAt,
        dataSource: p.dataSource,
        fatSecretId: p.fatSecretId,
        forPartnerId,
      }
      await foodApi.createFoodEntry(input)
      useDashboardStore().loadDailySummary()
      return true
    } catch {
      return false
    } finally {
      saving.value = false
    }
  }

  async function saveManualEntry(input: FoodEntryInput): Promise<boolean> {
    saving.value = true
    try {
      await foodApi.createFoodEntry({
        ...input,
        isManualEntry: true,
        dataSource: FoodDataSource.MANUAL,
      })
      useDashboardStore().loadDailySummary()
      return true
    } catch {
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteEntry(id: string): Promise<boolean> {
    try {
      await foodApi.deleteFoodEntry(id)
      useDashboardStore().loadDailySummary()
      return true
    } catch {
      return false
    }
  }

  function clearSearch() {
    query.value = ''
    results.value = []
    searchError.value = null
  }

  function resetForm() {
    selectedProduct.value = null
    mealType.value = MealType.BREAKFAST
    servingSize.value = 100
    servingUnit.value = 'g'
  }

  return {
    query, results, searching, searchError, recentSearches,
    selectedProduct, mealType, servingSize, servingUnit, saving,
    search, searchByBarcode, selectProduct, calculatedNutrition,
    saveEntry, saveManualEntry, deleteEntry, clearSearch, resetForm,
  }
})
