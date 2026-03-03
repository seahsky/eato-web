import { ref } from 'vue'
import type { WebPushSubscription } from '../api/types'

// These functions are loaded from public/web_push_helper.js
declare global {
  interface Window {
    webPushSubscribe(vapidPublicKey: string): Promise<string | null>
    webPushUnsubscribe(): Promise<boolean>
    webPushGetSubscription(): Promise<string | null>
    webPushRequestPermission(): Promise<NotificationPermission>
    webPushGetPermission(): NotificationPermission
    webPushIsSupported(): boolean
  }
}

export function useWebPush() {
  const isSupported = ref(typeof window !== 'undefined' && window.webPushIsSupported?.() === true)
  const permission = ref<NotificationPermission>(
    typeof window !== 'undefined' && window.webPushGetPermission ? window.webPushGetPermission() : 'default',
  )

  async function requestPermission(): Promise<NotificationPermission> {
    if (!isSupported.value) return 'denied'
    const result = await window.webPushRequestPermission()
    permission.value = result
    return result
  }

  async function subscribe(): Promise<WebPushSubscription | null> {
    if (!isSupported.value) return null
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.error('[useWebPush] VITE_VAPID_PUBLIC_KEY not set')
      return null
    }
    const json = await window.webPushSubscribe(vapidKey)
    if (!json) return null
    return JSON.parse(json) as WebPushSubscription
  }

  async function unsubscribe(): Promise<boolean> {
    if (!isSupported.value) return false
    return window.webPushUnsubscribe()
  }

  async function getSubscription(): Promise<WebPushSubscription | null> {
    if (!isSupported.value) return null
    const json = await window.webPushGetSubscription()
    if (!json) return null
    return JSON.parse(json) as WebPushSubscription
  }

  return { isSupported, permission, requestPermission, subscribe, unsubscribe, getSubscription }
}
