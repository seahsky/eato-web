export interface User {
  id: string
  clerkId: string
  email: string
  name: string | null
  profileCompleted: boolean
  partnerId: string | null
  createdAt: string
  updatedAt: string
  // Gamification
  currentStreak: number
  longestStreak: number
  goalStreak: number
  longestGoalStreak: number
  weeklyStreak: number
  longestWeeklyStreak: number
  currentWeekDays: number
  partnerShields: number
  unlockedTheme: string
  avatarFrame: string
}

export enum AuthStatus {
  Initial = 'initial',
  Loading = 'loading',
  Authenticated = 'authenticated',
  Unauthenticated = 'unauthenticated',
}

export interface AuthState {
  status: AuthStatus
  user: User | null
  error: string | null
}
