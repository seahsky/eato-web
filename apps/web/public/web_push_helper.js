// Web Push API helper functions for Flutter web interop
// Follows the same pattern as clerk_init.js

/**
 * Subscribe to web push notifications using the browser Push API.
 * Returns a JSON string with { endpoint, p256dh, auth } on success, or null on failure.
 *
 * @param {string} vapidPublicKey - The VAPID public key (base64url encoded)
 * @returns {Promise<string|null>} JSON subscription data or null
 */
window.webPushSubscribe = async function(vapidPublicKey) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('[WebPush] Push notifications not supported in this browser');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    // Convert VAPID key from base64url to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });

    const subscriptionJson = subscription.toJSON();

    const result = JSON.stringify({
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth,
    });

    console.log('[WebPush] Subscribed successfully');
    return result;
  } catch (e) {
    console.error('[WebPush] Subscription failed:', e);
    return null;
  }
};

/**
 * Unsubscribe from web push notifications.
 * @returns {Promise<boolean>} true if unsubscribed successfully
 */
window.webPushUnsubscribe = async function() {
  try {
    if (!('serviceWorker' in navigator)) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[WebPush] Unsubscribed successfully');
      return true;
    }

    return false;
  } catch (e) {
    console.error('[WebPush] Unsubscribe failed:', e);
    return false;
  }
};

/**
 * Get the current push subscription if one exists.
 * @returns {Promise<string|null>} JSON subscription data or null
 */
window.webPushGetSubscription = async function() {
  try {
    if (!('serviceWorker' in navigator)) return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return null;

    const subscriptionJson = subscription.toJSON();
    return JSON.stringify({
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth,
    });
  } catch (e) {
    console.error('[WebPush] Get subscription failed:', e);
    return null;
  }
};

/**
 * Request notification permission from the browser.
 * @returns {Promise<string>} 'granted', 'denied', or 'default'
 */
window.webPushRequestPermission = async function() {
  try {
    const result = await Notification.requestPermission();
    console.log('[WebPush] Permission result:', result);
    return result;
  } catch (e) {
    console.error('[WebPush] Permission request failed:', e);
    return 'denied';
  }
};

/**
 * Get the current notification permission status.
 * @returns {string} 'granted', 'denied', or 'default'
 */
window.webPushGetPermission = function() {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

/**
 * Check if Web Push is supported in this browser.
 * @returns {boolean}
 */
window.webPushIsSupported = function() {
  return 'serviceWorker' in navigator &&
         'PushManager' in window &&
         'Notification' in window;
};

/**
 * Convert a base64url-encoded string to a Uint8Array.
 * Used to convert VAPID public key for PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
