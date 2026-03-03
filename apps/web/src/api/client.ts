import axios from 'axios'
import type { AxiosInstance } from 'axios'

let getTokenFn: (() => Promise<string | null>) | null = null

/** Register the Clerk getToken function for the auth interceptor */
export function setAuthTokenProvider(fn: () => Promise<string | null>) {
  getTokenFn = fn
}

/** Callback invoked on unrecoverable 401. Wired up by the auth store. */
let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn
}

const api: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ''}/api/rest`,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor: inject Bearer token
api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    const token = await getTokenFn()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor: handle 401 + retry on 5xx
let lastUnauthorizedAt = 0
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    // 401: sign out with cooldown (avoid rapid-fire)
    if (status === 401) {
      const now = Date.now()
      if (now - lastUnauthorizedAt > 5_000) {
        lastUnauthorizedAt = now
        onUnauthorized?.()
      }
      return Promise.reject(error)
    }

    // 5xx: retry once with 1s backoff
    const config = error.config
    if (status >= 500 && !config._retried) {
      config._retried = true
      await new Promise((r) => setTimeout(r, 1_000))
      return api(config)
    }

    return Promise.reject(error)
  },
)

export default api
