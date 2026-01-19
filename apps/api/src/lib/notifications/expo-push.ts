import Expo, { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { prisma } from "@/lib/prisma";
import type { NotificationPayload, SendResult } from "./types";

// Lazy initialization for serverless environment
let expoClient: Expo | null = null;

function getExpoClient(): Expo {
  if (!expoClient) {
    expoClient = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true, // Use FCM v1 API for Android
    });
  }
  return expoClient;
}

/**
 * Send Expo push notification to all Expo subscriptions for a user
 */
export async function sendExpoPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<SendResult> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, tokenType: "EXPO_PUSH" },
  });

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  const expo = getExpoClient();
  const messages: ExpoPushMessage[] = [];
  const subscriptionMap = new Map<string, string>(); // expoToken -> subscriptionId

  for (const sub of subscriptions) {
    if (!sub.expoToken || !Expo.isExpoPushToken(sub.expoToken)) {
      continue;
    }

    subscriptionMap.set(sub.expoToken, sub.id);

    messages.push({
      to: sub.expoToken,
      title: payload.title,
      body: payload.body,
      sound: "default",
      badge: 1,
      data: {
        url: payload.url || "/dashboard",
        ...payload.data,
      },
      categoryId: payload.tag, // For notification actions
    });
  }

  if (messages.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  // Chunk messages (Expo recommends max 100 per request)
  const chunks = expo.chunkPushNotifications(messages);
  const errors: Array<{ subscriptionId: string; error: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const tickets: ExpoPushTicket[] =
        await expo.sendPushNotificationsAsync(chunk);

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const message = chunk[i] as ExpoPushMessage;
        const token = message.to as string;
        const subscriptionId = subscriptionMap.get(token);

        if (!subscriptionId) continue;

        if (ticket.status === "ok") {
          sent++;
        } else {
          failed++;
          errors.push({ subscriptionId, error: ticket.message });

          // Handle DeviceNotRegistered - remove invalid token
          if (ticket.details?.error === "DeviceNotRegistered") {
            await prisma.pushSubscription.delete({
              where: { id: subscriptionId },
            });
          }
        }
      }
    } catch (error) {
      console.error("Expo push error:", error);
      failed += chunk.length;
    }
  }

  return {
    success: true,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}
