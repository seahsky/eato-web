import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailySummary } from '../api/types'
import { getDailySummary } from '../api/endpoints/stats'
import { cacheGet, cacheSet } from '../composables/useCache'
import { formatDate, addDays, isToday } from '../utils/date'

export const useDashboardStore = defineStore('dashboard', () => {
  const dailySummary = ref<DailySummary | null>(null)
  const selectedDate = ref(new Date())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isOffline = ref(false)

  const dateString = computed(() => formatDate(selectedDate.value))
  const isSelectedDateToday = computed(() => isToday(selectedDate.value))

  const formattedDate = computed(() => {
    if (isSelectedDateToday.value) return 'Today'
    const yesterday = addDays(new Date(), -1)
    if (formatDate(selectedDate.value) === formatDate(yesterday)) return 'Yesterday'
    return selectedDate.value.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  })

  async function loadDailySummary() {
    const dateStr = dateString.value
    const cacheKey = `daily_summary:${dateStr}`

    // Cache-first
    const cached = await cacheGet<DailySummary>(cacheKey)
    if (cached) {
      dailySummary.value = cached
    }

    loading.value = true
    error.value = null

    try {
      const data = await getDailySummary(dateStr)
      dailySummary.value = data
      isOffline.value = false
      await cacheSet(cacheKey, data)
    } catch (e: any) {
      const isNetworkError = !e.response
      if (cached) {
        isOffline.value = isNetworkError
      } else {
        error.value = isNetworkError ? null : (e.message ?? 'Failed to load summary')
        isOffline.value = isNetworkError
      }
    } finally {
      loading.value = false
    }
  }

  async function selectDate(date: Date) {
    selectedDate.value = date
    await loadDailySummary()
  }

  async function previousDay() {
    await selectDate(addDays(selectedDate.value, -1))
  }

  async function nextDay() {
    if (!isSelectedDateToday.value) {
      await selectDate(addDays(selectedDate.value, 1))
    }
  }

  async function goToToday() {
    await selectDate(new Date())
  }

  return {
    dailySummary,
    selectedDate,
    loading,
    error,
    isOffline,
    dateString,
    isSelectedDateToday,
    formattedDate,
    loadDailySummary,
    selectDate,
    previousDay,
    nextDay,
    goToToday,
  }
})
