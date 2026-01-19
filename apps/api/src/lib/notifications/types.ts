// Notification types for push notifications

export type NotificationType =
  | "PARTNER_FOOD_LOGGED"
  | "PARTNER_GOAL_REACHED"
  | "PARTNER_LINKED"
  | "NUDGE"
  | "MEAL_REMINDER"
  | "PENDING_APPROVAL"
  | "CELEBRATION"
  | "BADGE_UNLOCKED"
  | "APPROVAL_RESULT";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Web Push specific (VAPID)
export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Unified result type for notification sending
export interface SendResult {
  success: boolean;
  sent: number;
  failed: number;
  errors?: Array<{ subscriptionId: string; error: string }>;
}

export interface SendNotificationOptions {
  userId: string;
  payload: NotificationPayload;
  type: NotificationType;
}

// Legacy alias for backward compatibility
export type PushSubscriptionJSON = WebPushSubscription;
