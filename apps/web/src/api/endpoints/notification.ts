import api from '../client'
import type { NotificationSettings, NotificationSettingsInput } from '../types'

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await api.get<NotificationSettings>('/notifications/settings')
  return data
}

export async function updateNotificationSettings(input: NotificationSettingsInput): Promise<NotificationSettings> {
  const { data } = await api.put<NotificationSettings>('/notifications/settings', input)
  return data
}

export async function subscribeWebPush(subscription: {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}): Promise<void> {
  await api.post('/notifications/subscribe', subscription)
}

export async function unsubscribeNotifications(): Promise<void> {
  await api.post('/notifications/unsubscribe')
}

export async function hasNotificationSubscription(): Promise<boolean> {
  const { data } = await api.get<boolean>('/notifications/has-subscription')
  return data
}

export async function sendNudge(message?: string): Promise<{ sentAt: string }> {
  const { data } = await api.post<{ sentAt: string }>('/notifications/nudge', { message })
  return data
}

export async function getLastNudge(): Promise<{ createdAt: string; message: string | null } | null> {
  const { data } = await api.get('/notifications/nudge/last')
  return data
}
