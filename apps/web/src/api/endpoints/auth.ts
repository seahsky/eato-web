import api from '../client'
import type { User } from '../types'

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

export async function generatePartnerCode(): Promise<string> {
  const { data } = await api.post<{ code: string }>('/auth/partner-code')
  return data.code
}

export async function linkPartner(code: string): Promise<void> {
  await api.post('/auth/link-partner', { code })
}

export async function unlinkPartner(): Promise<void> {
  await api.post('/auth/unlink-partner')
}
