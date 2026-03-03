import api from '../client'
import type { Badge, AchievementSummary } from '../types'

export async function getAllAchievements(): Promise<{ badges: Badge[] }> {
  const { data } = await api.get<{ badges: Badge[] }>('/achievements')
  return data
}

export async function getAchievementsByCategory(): Promise<Record<string, Badge[]>> {
  const { data } = await api.get<Record<string, Badge[]>>('/achievements/by-category')
  return data
}

export async function getRecentAchievements(): Promise<Badge[]> {
  const { data } = await api.get<Badge[]>('/achievements/recent')
  return data
}

export async function getAchievementSummary(): Promise<AchievementSummary> {
  const { data } = await api.get<AchievementSummary>('/achievements/summary')
  return data
}

export async function getPartnerAchievements(): Promise<{ badges: Badge[] } | null> {
  const { data } = await api.get<{ badges: Badge[] } | null>('/achievements/partner')
  return data
}

export async function updateTheme(theme: string): Promise<void> {
  await api.put('/achievements/theme', { theme })
}

export async function updateAvatarFrame(avatarFrame: string): Promise<void> {
  await api.put('/achievements/avatar-frame', { avatarFrame })
}
