import { prisma } from "@/lib/prisma";
import { sendWebPushNotification } from "./web-push";
import type { NotificationPayload, SendResult } from "./types";

/**
 * Send notification to all of a user's devices (web push)
 * This is the main entry point for all notification sending
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<SendResult> {
  return sendWebPushNotification(userId, payload);
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
