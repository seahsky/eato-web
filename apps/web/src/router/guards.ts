import type { Router } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { AuthStatus } from '../api/types'

export function setupGuards(router: Router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    const isLoggedIn = auth.status === AuthStatus.Authenticated
    const isLoading = auth.status === AuthStatus.Loading || auth.status === AuthStatus.Initial
    const isLoginRoute = to.name === 'login'
    const isProfileSetupRoute = to.name === 'profile-setup'

    // Don't redirect while checking auth status
    if (isLoading) return true

    // Redirect to login if not authenticated
    if (!isLoggedIn && !isLoginRoute) {
      return { name: 'login' }
    }

    // Redirect authenticated users away from login
    if (isLoggedIn && isLoginRoute) {
      if (auth.needsOnboarding) {
        return { name: 'profile-setup' }
      }
      return { name: 'dashboard' }
    }

    // Redirect to profile setup if needs onboarding
    if (isLoggedIn && auth.needsOnboarding && !isProfileSetupRoute) {
      return { name: 'profile-setup' }
    }

    return true
  })
}
