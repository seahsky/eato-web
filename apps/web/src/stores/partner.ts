import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailySummary, WeeklySummary } from '../api/types'
import * as authApi from '../api/endpoints/auth'
import * as statsApi from '../api/endpoints/stats'
import * as notifApi from '../api/endpoints/notification'
import { useAuthStore } from './auth'

export const usePartnerStore = defineStore('partner', () => {
  const partnerDailySummary = ref<DailySummary | null>(null)
  const partnerWeeklySummary = ref<WeeklySummary | null>(null)
  const partnerCode = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const auth = useAuthStore()
  const hasPartner = computed(() => auth.hasPartner)

  async function generateCode() {
    loading.value = true
    error.value = null
    try {
      partnerCode.value = await authApi.generatePartnerCode()
    } catch (e: any) {
      error.value = e.message ?? 'Failed to generate code'
    } finally {
      loading.value = false
    }
  }

  async function linkPartner(code: string) {
    loading.value = true
    error.value = null
    try {
      await authApi.linkPartner(code)
      await auth.refreshUser()
    } catch (e: any) {
      error.value = e.response?.data?.message ?? e.message ?? 'Failed to link partner'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function unlinkPartner() {
    loading.value = true
    error.value = null
    try {
      await authApi.unlinkPartner()
      await auth.refreshUser()
      partnerDailySummary.value = null
      partnerWeeklySummary.value = null
    } catch (e: any) {
      error.value = e.message ?? 'Failed to unlink partner'
    } finally {
      loading.value = false
    }
  }

  async function loadPartnerDaily(date: string) {
    if (!hasPartner.value) return
    loading.value = true
    try {
      partnerDailySummary.value = await statsApi.getPartnerDailySummary(date)
    } catch {
      // Ignore
    } finally {
      loading.value = false
    }
  }

  async function loadPartnerWeekly(startDate: string) {
    if (!hasPartner.value) return
    loading.value = true
    try {
      partnerWeeklySummary.value = await statsApi.getPartnerWeeklySummary(startDate)
    } catch {
      // Ignore
    } finally {
      loading.value = false
    }
  }

  async function sendNudge(message?: string) {
    try {
      await notifApi.sendNudge(message)
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Failed to send nudge'
      throw e
    }
  }

  return {
    partnerDailySummary, partnerWeeklySummary, partnerCode, loading, error, hasPartner,
    generateCode, linkPartner, unlinkPartner, loadPartnerDaily, loadPartnerWeekly, sendNudge,
  }
})
