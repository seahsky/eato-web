/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: sw.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Push notification types
interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Push notification handler
sw.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json() as PushNotificationData;
  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    tag: data.tag || "eato-notification",
    data: { url: data.url || "/dashboard", ...data.data },
    vibrate: [100, 50, 100],
  } satisfies NotificationOptions & { vibrate?: number[] };

  // Post message to all clients for foreground handling
  event.waitUntil(
    Promise.all([
      sw.registration.showNotification(data.title, options),
      sw.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "push-notification",
            title: data.title,
            body: data.body,
            tag: data.tag,
            data: data.data,
          });
        });
      }),
    ])
  );
});

// Notification click handler
sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url = (event.notification.data?.url as string) || "/dashboard";

  event.waitUntil(
    sw.clients.matchAll({ type: "window" }).then((clients) => {
      // Try to focus an existing window
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(url);
      }
    })
  );
});
