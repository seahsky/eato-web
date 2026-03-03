import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile, ProfileInput } from '../api/types'
import { ActivityLevelMultiplier, Gender } from '../api/types'
import * as profileApi from '../api/endpoints/profile'
import { cacheGet, cacheSet } from '../composables/useCache'

const CACHE_KEY = 'profile'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const hasProfile = computed(() => profile.value != null)

  async function loadProfile() {
    loading.value = true
    error.value = null

    // Cache-first
    const cached = await cacheGet<Profile>(CACHE_KEY)
    if (cached) {
      profile.value = cached
    }

    try {
      const data = await profileApi.getProfile()
      profile.value = data
      await cacheSet(CACHE_KEY, data)
    } catch (e: any) {
      if (!cached) {
        error.value = e.message ?? 'Failed to load profile'
      }
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(input: ProfileInput) {
    saving.value = true
    error.value = null
    try {
      const data = await profileApi.updateProfile(input)
      profile.value = data
      await cacheSet(CACHE_KEY, data)
    } catch (e: any) {
      error.value = e.message ?? 'Failed to update profile'
      throw e
    } finally {
      saving.value = false
    }
  }

  /** Calculate BMR using Mifflin-St Jeor equation */
  function calculateBmr(weight: number, height: number, age: number, gender: Gender): number {
    if (gender === Gender.MALE) {
      return 10 * weight + 6.25 * height - 5 * age + 5
    }
    return 10 * weight + 6.25 * height - 5 * age - 161
  }

  /** Calculate TDEE from BMR and activity level */
  function calculateTdee(bmr: number, activityLevel: keyof typeof ActivityLevelMultiplier): number {
    return bmr * ActivityLevelMultiplier[activityLevel]
  }

  return {
    profile,
    loading,
    saving,
    error,
    hasProfile,
    loadProfile,
    updateProfile,
    calculateBmr,
    calculateTdee,
  }
})
