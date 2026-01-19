import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import type { NotificationPayload, WebPushSubscription, SendResult } from "./types";

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
 * Send web push notification to all web push subscriptions for a user
 */
export async function sendWebPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<SendResult> {
  // Get only WEB_PUSH subscriptions for this user
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, tokenType: "WEB_PUSH" },
  });

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  const errors: Array<{ subscriptionId: string; error: string }> = [];
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      // Skip if missing required web push fields
      if (!sub.endpoint || !sub.p256dh || !sub.auth) {
        return { success: false, subscriptionId: sub.id, error: "Missing web push fields" };
      }

      const pushSubscription: WebPushSubscription = {
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
        return {
          success: false,
          subscriptionId: sub.id,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.success) {
        sent++;
      } else {
        failed++;
        if (result.value.error) {
          errors.push({
            subscriptionId: result.value.subscriptionId,
            error: result.value.error,
          });
        }
      }
    } else {
      failed++;
    }
  }

  return {
    success: true,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Legacy alias for backward compatibility
export const sendPushNotification = sendWebPushNotification;
