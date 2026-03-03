import api from '../client'
import type { DailySummary, WeeklySummary, StreakData, ShieldStatus, ShieldHistoryItem } from '../types'

export async function getDailySummary(date: string): Promise<DailySummary> {
  const { data } = await api.get<DailySummary>('/stats/daily', { params: { date } })
  return data
}

export async function getWeeklySummary(startDate: string): Promise<WeeklySummary> {
  const { data } = await api.get<WeeklySummary>('/stats/weekly', { params: { startDate } })
  return data
}

export async function getPartnerDailySummary(date: string): Promise<DailySummary> {
  const { data } = await api.get<DailySummary>('/stats/partner/daily', { params: { date } })
  return data
}

export async function getPartnerWeeklySummary(startDate: string): Promise<WeeklySummary> {
  const { data } = await api.get<WeeklySummary>('/stats/partner/weekly', { params: { startDate } })
  return data
}

export async function getStreakData(): Promise<StreakData> {
  const { data } = await api.get<StreakData>('/stats/streak')
  return data
}

export async function getPartnerStreakData(): Promise<StreakData | null> {
  const { data } = await api.get<StreakData | null>('/stats/partner/streak')
  return data
}

export async function getPartnerShieldStatus(): Promise<ShieldStatus> {
  const { data } = await api.get<ShieldStatus>('/stats/partner-shields')
  return data
}

export async function usePartnerShield(targetDate: string): Promise<void> {
  await api.post('/stats/partner-shields/use', { targetDate })
}

export async function getPartnerShieldHistory(): Promise<{ shields: ShieldHistoryItem[] }> {
  const { data } = await api.get<{ shields: ShieldHistoryItem[] }>('/stats/partner-shields/history')
  return data
}
