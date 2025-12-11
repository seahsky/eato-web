// Notification types for push notifications

export type NotificationType =
  | "PARTNER_FOOD_LOGGED"
  | "PARTNER_GOAL_REACHED"
  | "PARTNER_LINKED"
  | "NUDGE"
  | "MEAL_REMINDER";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SendNotificationOptions {
  userId: string;
  payload: NotificationPayload;
  type: NotificationType;
}
