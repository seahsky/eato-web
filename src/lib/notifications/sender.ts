import { prisma } from "@/lib/prisma";
import { sendWebPushNotification } from "./web-push";
import { sendExpoPushNotification } from "./expo-push";
import type { NotificationPayload, SendResult } from "./types";

/**
 * Send notification to all of a user's devices (web + mobile)
 * This is the main entry point for all notification sending
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<SendResult> {
  // Send to both platforms in parallel
  const [webResult, expoResult] = await Promise.all([
    sendWebPushNotification(userId, payload),
    sendExpoPushNotification(userId, payload),
  ]);

  const allErrors = [
    ...(webResult.errors || []),
    ...(expoResult.errors || []),
  ];

  return {
    success: webResult.success && expoResult.success,
    sent: webResult.sent + expoResult.sent,
    failed: webResult.failed + expoResult.failed,
    errors: allErrors.length > 0 ? allErrors : undefined,
  };
}

/**
 * Check if user has any push subscription (web or mobile)
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
    | "partnerFoodLogged"
    | "partnerGoalReached"
    | "partnerLinked"
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
