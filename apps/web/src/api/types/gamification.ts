export interface Badge {
  id: string
  badgeId: string
  name: string
  description: string
  icon: string
  category: string
  unlocked: boolean
  unlockedAt: string | null
  progress?: number
  target?: number
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  goalStreak: number
  longestGoalStreak: number
  weeklyStreak: number
  longestWeeklyStreak: number
  currentWeekDays: number
  lastLogDate: string | null
  restDaysRemaining: number
  restDayDates: string[]
}

export interface AchievementSummary {
  totalBadges: number
  unlockedBadges: number
  recentBadges: Badge[]
  categories: Record<string, { total: number; unlocked: number }>
}

export interface ShieldStatus {
  shieldsRemaining: number
  shieldsUsedThisMonth: string[]
  lastShieldReset: string
  canUseShield: boolean
  partnerStreakAtRisk: boolean
}

export interface ShieldHistoryItem {
  id: string
  shieldedDate: string
  createdAt: string
  fromUserName: string | null
  toUserName: string | null
}
