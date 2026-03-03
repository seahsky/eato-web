export interface NotificationSettings {
  id: string
  userId: string
  partnerFoodLogged: boolean
  partnerGoalReached: boolean
  partnerLinked: boolean
  receiveNudges: boolean
  breakfastReminderTime: string | null
  lunchReminderTime: string | null
  dinnerReminderTime: string | null
  timezone: string
}

export interface NotificationSettingsInput {
  partnerFoodLogged?: boolean
  partnerGoalReached?: boolean
  partnerLinked?: boolean
  receiveNudges?: boolean
  breakfastReminderTime?: string | null
  lunchReminderTime?: string | null
  dinnerReminderTime?: string | null
  timezone?: string
}

export interface WebPushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}
