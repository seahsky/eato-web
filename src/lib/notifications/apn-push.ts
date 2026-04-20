import { prisma } from "@/lib/prisma";
import type { NotificationPayload, SendResult } from "./types";

/**
 * APNs sender. Matches the `sendWebPushNotification` signature so the
 * dispatcher (sender.ts) can fan out to both without caring about platform.
 *
 * Actual APN delivery uses the apn-provider module (created on demand from
 * the APN_KEY_ID / APN_TEAM_ID / APN_BUNDLE_ID / APN_PRIVATE_KEY env vars).
 * If the module or env vars are missing we no-op gracefully — this keeps
 * local dev and the web-only deployment path working without forcing
 * every environment to install @parse/node-apn.
 */
export async function sendAPNsNotification(
  userId: string,
  payload: NotificationPayload
): Promise<SendResult> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, platform: "ios" },
  });

  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  const provider = await getAPNProvider();
  if (!provider) {
    // APNs not configured — pretend we succeeded with zero sends so the
    // caller's happy-path logging (notifyPartnerFoodLogged etc.) isn't
    // spammed with failures in local dev.
    return { success: true, sent: 0, failed: 0 };
  }

  const errors: Array<{ subscriptionId: string; error: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    if (!sub.apnToken) {
      failed++;
      errors.push({ subscriptionId: sub.id, error: "Missing apnToken" });
      continue;
    }
    try {
      const result = await provider.send(sub.apnToken, payload);
      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push({ subscriptionId: sub.id, error: result.error ?? "unknown" });
        // Clean up tokens Apple tells us are gone.
        if (result.status === 410 || result.reason === "BadDeviceToken" || result.reason === "Unregistered") {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    } catch (error) {
      failed++;
      errors.push({
        subscriptionId: sub.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    success: true,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

interface APNProvider {
  send(
    token: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; status?: number; reason?: string; error?: string }>;
}

let providerPromise: Promise<APNProvider | null> | null = null;

function getAPNProvider(): Promise<APNProvider | null> {
  if (!providerPromise) {
    providerPromise = buildAPNProvider();
  }
  return providerPromise;
}

async function buildAPNProvider(): Promise<APNProvider | null> {
  const { APN_KEY_ID, APN_TEAM_ID, APN_BUNDLE_ID, APN_PRIVATE_KEY } = process.env;
  if (!APN_KEY_ID || !APN_TEAM_ID || !APN_BUNDLE_ID || !APN_PRIVATE_KEY) {
    return null;
  }
  // Lazy import so deployments that never send to iOS don't have to install
  // the native-ish @parse/node-apn package.
  type ApnModule = {
    Provider: new (options: {
      token: { key: string; keyId: string; teamId: string };
      production?: boolean;
    }) => ApnProviderInstance;
    Notification: new () => ApnNotification;
  };
  type ApnNotification = {
    topic?: string;
    alert?: { title: string; body: string } | string;
    sound?: string;
    payload?: Record<string, unknown>;
  };
  type ApnProviderInstance = {
    send(note: ApnNotification, token: string | string[]): Promise<{
      failed: Array<{
        status?: string;
        response?: { reason?: string };
        error?: Error;
      }>;
    }>;
  };
  let apn: ApnModule;
  try {
    // @ts-expect-error optional peer dependency; only installed when APNs is configured
    apn = (await import("@parse/node-apn")) as ApnModule;
  } catch {
    // eslint-disable-next-line no-console
    console.warn("[apn] @parse/node-apn not installed — iOS pushes disabled");
    return null;
  }

  const p = new apn.Provider({
    token: {
      key: APN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      keyId: APN_KEY_ID,
      teamId: APN_TEAM_ID,
    },
    production: process.env.NODE_ENV === "production",
  });

  return {
    async send(token, payload) {
      const note = new apn.Notification();
      note.topic = APN_BUNDLE_ID;
      note.alert = { title: payload.title, body: payload.body };
      note.sound = "default";
      note.payload = {
        tag: payload.tag,
        url: payload.url,
        ...(payload.data ?? {}),
      };
      const response = await p.send(note, token);
      const failure = response.failed[0];
      if (failure) {
        return {
          success: false,
          status: failure.status ? Number(failure.status) : undefined,
          reason: typeof failure.response === "object" ? failure.response?.reason : undefined,
          error: failure.error?.message,
        };
      }
      return { success: true };
    },
  };
}
