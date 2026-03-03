import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FoodEntry } from '../api/types'
import * as foodApi from '../api/endpoints/food'

export const useApprovalStore = defineStore('approval', () => {
  const pendingApprovals = ref<FoodEntry[]>([])
  const mySubmissions = ref<FoodEntry[]>([])
  const pendingCount = ref(0)
  const loading = ref(false)

  async function loadPendingApprovals() {
    loading.value = true
    try {
      pendingApprovals.value = await foodApi.getPendingApprovals()
      pendingCount.value = pendingApprovals.value.length
    } catch {
      // Ignore
    } finally {
      loading.value = false
    }
  }

  async function loadMySubmissions() {
    loading.value = true
    try {
      mySubmissions.value = await foodApi.getMyPendingSubmissions()
    } catch {
      // Ignore
    } finally {
      loading.value = false
    }
  }

  async function loadPendingCount() {
    try {
      pendingCount.value = await foodApi.getPendingApprovalCount()
    } catch {
      // Ignore
    }
  }

  async function approve(entryId: string) {
    await foodApi.approveEntry(entryId)
    pendingApprovals.value = pendingApprovals.value.filter((e) => e.id !== entryId)
    pendingCount.value = Math.max(0, pendingCount.value - 1)
  }

  async function reject(entryId: string, note?: string) {
    await foodApi.rejectEntry(entryId, note)
    pendingApprovals.value = pendingApprovals.value.filter((e) => e.id !== entryId)
    pendingCount.value = Math.max(0, pendingCount.value - 1)
  }

  async function resubmit(entryId: string) {
    await foodApi.resubmitEntry(entryId)
    mySubmissions.value = mySubmissions.value.filter((e) => e.id !== entryId)
  }

  return {
    pendingApprovals, mySubmissions, pendingCount, loading,
    loadPendingApprovals, loadMySubmissions, loadPendingCount, approve, reject, resubmit,
  }
})
