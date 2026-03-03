import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AuthStatus } from '../api/types'
import type { User } from '../api/types'
import { getCurrentUser } from '../api/endpoints/auth'
import { setAuthTokenProvider, setOnUnauthorized } from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>(AuthStatus.Initial)
  const user = ref<User | null>(null)
  const error = ref<string | null>(null)

  // Derived
  const isAuthenticated = computed(() => status.value === AuthStatus.Authenticated)
  const isLoading = computed(() => status.value === AuthStatus.Loading || status.value === AuthStatus.Initial)
  const needsOnboarding = computed(() => user.value != null && !user.value.profileCompleted)
  const hasPartner = computed(() => user.value?.partnerId != null)

  /** Wired by main.ts after Clerk is ready */
  let clerkSignOut: (() => Promise<void>) | null = null

  function setClerkHelpers(getToken: () => Promise<string | null>, signOutFn: () => Promise<void>) {
    clerkSignOut = signOutFn

    // Wire Axios interceptor
    setAuthTokenProvider(getToken)
    setOnUnauthorized(() => signOut(false))
  }

  async function refreshUser() {
    try {
      const data = await getCurrentUser()
      user.value = data
      status.value = AuthStatus.Authenticated
      error.value = null
    } catch (e: any) {
      user.value = null
      status.value = AuthStatus.Unauthenticated
      error.value = e.message ?? 'Failed to fetch user'
    }
  }

  /** Called when Clerk reports a signed-in session */
  async function handleSignedIn() {
    status.value = AuthStatus.Loading
    await refreshUser()
  }

  /** Called when Clerk reports no session */
  function handleSignedOut() {
    user.value = null
    status.value = AuthStatus.Unauthenticated
    error.value = null
  }

  /**
   * Sign out.
   * @param fromUser  true = explicit user action (destroys Clerk session);
   *                  false = error-triggered (preserves Clerk session for auto-recovery)
   */
  async function signOut(fromUser = true) {
    if (fromUser && clerkSignOut) {
      try {
        await clerkSignOut()
      } catch {
        // Ignore Clerk sign-out errors
      }
    }
    user.value = null
    status.value = AuthStatus.Unauthenticated
    error.value = null
  }

  return {
    status,
    user,
    error,
    isAuthenticated,
    isLoading,
    needsOnboarding,
    hasPartner,
    setClerkHelpers,
    refreshUser,
    handleSignedIn,
    handleSignedOut,
    signOut,
  }
})
