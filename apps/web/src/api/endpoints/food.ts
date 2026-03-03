import api from '../client'
import type { FoodEntry, FoodEntryInput, FoodProduct } from '../types'

export async function searchFood(query: string): Promise<FoodProduct[]> {
  const { data } = await api.get<FoodProduct[]>('/food/search', { params: { q: query } })
  return data
}

export async function getFoodByBarcode(barcode: string): Promise<FoodProduct> {
  const { data } = await api.get<FoodProduct>(`/food/barcode/${barcode}`)
  return data
}

export async function createFoodEntry(input: FoodEntryInput): Promise<FoodEntry> {
  const { data } = await api.post<FoodEntry>('/food/entries', input)
  return data
}

export async function getFoodEntry(id: string): Promise<FoodEntry> {
  const { data } = await api.get<FoodEntry>(`/food/entries/${id}`)
  return data
}

export async function updateFoodEntry(id: string, input: Partial<FoodEntryInput>): Promise<FoodEntry> {
  const { data } = await api.put<FoodEntry>(`/food/entries/${id}`, input)
  return data
}

export async function deleteFoodEntry(id: string): Promise<void> {
  await api.delete(`/food/entries/${id}`)
}

export async function getPendingApprovals(): Promise<FoodEntry[]> {
  const { data } = await api.get<FoodEntry[]>('/food/pending-approvals')
  return data
}

export async function getPendingApprovalCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/food/pending-approvals/count')
  return data.count
}

export async function getMyPendingSubmissions(): Promise<FoodEntry[]> {
  const { data } = await api.get<FoodEntry[]>('/food/my-pending-submissions')
  return data
}

export async function approveEntry(entryId: string): Promise<void> {
  await api.post(`/food/entries/${entryId}/approve`)
}

export async function rejectEntry(entryId: string, note?: string): Promise<void> {
  await api.post(`/food/entries/${entryId}/reject`, { note })
}

export async function resubmitEntry(entryId: string): Promise<void> {
  await api.post(`/food/entries/${entryId}/resubmit`)
}
