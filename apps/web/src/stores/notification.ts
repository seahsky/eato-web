import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NotificationSettings, NotificationSettingsInput } from '../api/types'
import * as notifApi from '../api/endpoints/notification'
import { useWebPush } from '../composables/useWebPush'

export const useNotificationStore = defineStore('notification', () => {
  const settings = ref<NotificationSettings | null>(null)
  const isSubscribed = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const webPush = useWebPush()

  async function loadSettings() {
    loading.value = true
    try {
      settings.value = await notifApi.getNotificationSettings()
    } catch {
      // Ignore
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(input: NotificationSettingsInput) {
    try {
      settings.value = await notifApi.updateNotificationSettings(input)
    } catch (e: any) {
      error.value = e.message ?? 'Failed to update settings'
      throw e
    }
  }

  async function checkSubscription() {
    isSubscribed.value = await notifApi.hasNotificationSubscription()
  }

  async function subscribe(): Promise<boolean> {
    if (!webPush.isSupported.value) return false

    const permission = await webPush.requestPermission()
    if (permission !== 'granted') return false

    const subscription = await webPush.subscribe()
    if (!subscription) return false

    try {
      await notifApi.subscribeWebPush({
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        userAgent: navigator.userAgent,
      })
      isSubscribed.value = true
      return true
    } catch {
      return false
    }
  }

  async function unsubscribe(): Promise<boolean> {
    try {
      await webPush.unsubscribe()
      await notifApi.unsubscribeNotifications()
      isSubscribed.value = false
      return true
    } catch {
      return false
    }
  }

  return {
    settings, isSubscribed, loading, error, webPush,
    loadSettings, updateSettings, checkSubscription, subscribe, unsubscribe,
  }
})
