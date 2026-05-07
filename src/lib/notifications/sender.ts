import { prisma } from "@/lib/prisma";
import { sendWebPushNotification } from "./web-push";
import { sendAPNsNotification } from "./apn-push";
import type { NotificationPayload, SendResult } from "./types";

/**
 * Send notification to all of a user's devices — fans out to Web Push
 * and APNs in parallel. Either dispatch returning sent:0 is fine (the
 * user might only have web devices, or APN might be unconfigured).
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<SendResult> {
  const [web, ios] = await Promise.all([
    sendWebPushNotification(userId, payload),
    sendAPNsNotification(userId, payload),
  ]);

  const errors = [...(web.errors ?? []), ...(ios.errors ?? [])];
  return {
    success: web.success && ios.success,
    sent: web.sent + ios.sent,
    failed: web.failed + ios.failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Check if user has any push subscription
 */
export async function userHasAnySubscription(userId: string): Promise<boolean> {
  const count = await prisma.pushSubscription.count({
    where: { userId },
  });
  return count > 0;
}

/**
 * Check if user has notifications enabled for a specific type
 */
export async function isNotificationEnabled(
  userId: string,
  settingKey:
    | "friendFoodLogged"
    | "friendGoalReached"
    | "friendAdded"
    | "receiveNudges"
): Promise<boolean> {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  // If no settings exist, use defaults (all enabled)
  if (!settings) {
    return true;
  }

  return settings[settingKey];
}
