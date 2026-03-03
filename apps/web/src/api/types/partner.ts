import type { FoodEntry } from './food'

export interface Partner {
  id: string
  name: string | null
  email: string
  currentStreak: number
  goalStreak: number
  weeklyStreak: number
  avatarFrame: string
  unlockedTheme: string
}

export interface PendingApproval {
  id: string
  entry: FoodEntry
  loggedByName: string | null
}

export interface MySubmission {
  id: string
  entry: FoodEntry
  submittedToName: string | null
}
