import api from '../client'
import type { Profile, ProfileInput } from '../types'

export async function getProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>('/profile')
  return data
}

export async function updateProfile(input: ProfileInput): Promise<Profile> {
  const { data } = await api.put<Profile>('/profile', input)
  return data
}
