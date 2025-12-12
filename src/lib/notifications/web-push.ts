import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import type { NotificationPayload, PushSubscriptionJSON } from "./types";

// Type for PushSubscription from database
interface DbPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: Date;
}

// Initialize web-push with VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@eato.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * Send a push notification to all of a user's subscribed devices
 */
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  // Get all subscriptions for this user
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  }) as DbPushSubscription[];

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription: PushSubscriptionJSON = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || "/icons/icon-192x192.png",
            badge: payload.badge || "/icons/badge-72x72.png",
            tag: payload.tag,
            url: payload.url || "/dashboard",
            data: payload.data,
          })
        );
        return { success: true, subscriptionId: sub.id };
      } catch (error) {
        // Handle expired or invalid subscriptions (410 Gone)
        if (error instanceof webpush.WebPushError && error.statusCode === 410) {
          // Remove invalid subscription
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
        return { success: false, subscriptionId: sub.id, error };
      }
    })
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  const failed = results.length - sent;

  return { success: true, sent, failed };
}

/**
 * Check if a user has push notification capability (at least one subscription)
 */
export async function userHasPushSubscription(userId: string): Promise<boolean> {
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
  settingKey: "partnerFoodLogged" | "partnerGoalReached" | "partnerLinked" | "receiveNudges"
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
