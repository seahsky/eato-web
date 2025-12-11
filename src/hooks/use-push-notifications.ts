"use client";

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/trpc/react";

type PermissionState = NotificationPermission | "unsupported";

// Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const subscribeMutation = trpc.notification.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      utils.notification.hasSubscription.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const unsubscribeMutation = trpc.notification.unsubscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(false);
      utils.notification.hasSubscription.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Check if push notifications are supported
  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // Initialize state on mount
  useEffect(() => {
    if (!isSupported) {
      setPermission("unsupported");
      setIsLoading(false);
      return;
    }

    // Get current permission state
    setPermission(Notification.permission);

    // Check if already subscribed
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        // Ignore errors during check
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSupported]);

  // Request permission and subscribe
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setError("Notification permission was denied");
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Get subscription details
      const subscriptionJSON = subscription.toJSON();
      if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
        throw new Error("Invalid subscription data");
      }

      // Save to server
      await subscribeMutation.mutateAsync({
        endpoint: subscriptionJSON.endpoint,
        p256dh: subscriptionJSON.keys.p256dh,
        auth: subscriptionJSON.keys.auth,
        userAgent: navigator.userAgent,
      });

      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, subscribeMutation]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;

    setError(null);
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, unsubscribeMutation]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading: isLoading || subscribeMutation.isPending || unsubscribeMutation.isPending,
    error,
    subscribe,
    unsubscribe,
  };
}
