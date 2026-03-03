import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Badge, StreakData, AchievementSummary, ShieldStatus } from '../api/types'
import * as achievementsApi from '../api/endpoints/achievements'
import * as statsApi from '../api/endpoints/stats'
import { cacheGet, cacheSet } from '../composables/useCache'

export const useGamificationStore = defineStore('gamification', () => {
  const badges = ref<Badge[]>([])
  const badgesByCategory = ref<Record<string, Badge[]>>({})
  const streak = ref<StreakData | null>(null)
  const summary = ref<AchievementSummary | null>(null)
  const shieldStatus = ref<ShieldStatus | null>(null)
  const loading = ref(false)

  async function loadBadges() {
    loading.value = true
    const cached = await cacheGet<Badge[]>('badges')
    if (cached) badges.value = cached

    try {
      const data = await achievementsApi.getAllAchievements()
      badges.value = data.badges
      await cacheSet('badges', data.badges)
    } catch {
      // Use cache
    } finally {
      loading.value = false
    }
  }

  async function loadBadgesByCategory() {
    try {
      badgesByCategory.value = await achievementsApi.getAchievementsByCategory()
    } catch {
      // Ignore
    }
  }

  async function loadStreak() {
    try {
      streak.value = await statsApi.getStreakData()
    } catch {
      // Ignore
    }
  }

  async function loadSummary() {
    loading.value = true
    const cached = await cacheGet<AchievementSummary>('achievement_summary')
    if (cached) summary.value = cached

    try {
      summary.value = await achievementsApi.getAchievementSummary()
      await cacheSet('achievement_summary', summary.value)
    } catch {
      // Use cache
    } finally {
      loading.value = false
    }
  }

  async function loadShieldStatus() {
    try {
      shieldStatus.value = await statsApi.getPartnerShieldStatus()
    } catch {
      // Ignore
    }
  }

  async function useShield(targetDate: string) {
    await statsApi.usePartnerShield(targetDate)
    await loadShieldStatus()
  }

  async function updateTheme(theme: string) {
    await achievementsApi.updateTheme(theme)
  }

  async function updateAvatarFrame(frame: string) {
    await achievementsApi.updateAvatarFrame(frame)
  }

  return {
    badges, badgesByCategory, streak, summary, shieldStatus, loading,
    loadBadges, loadBadgesByCategory, loadStreak, loadSummary, loadShieldStatus,
    useShield, updateTheme, updateAvatarFrame,
  }
})
