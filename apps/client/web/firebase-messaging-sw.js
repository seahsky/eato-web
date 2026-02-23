// Firebase Messaging Service Worker for Eato PWA
// Handles background push notifications

// Import config and Firebase SDK
importScripts('firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase using config from firebase-config.js
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Eato';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/Icon-192.png',
    badge: '/icons/Icon-maskable-192.png',
    data: payload.data,
    tag: payload.data?.type || 'default',
    vibrate: [100, 50, 100],
    requireInteraction: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Route based on notification type
  switch (data.type) {
    case 'PENDING_APPROVAL':
      targetUrl = '/partner/approvals';
      break;
    case 'NUDGE':
    case 'PARTNER_LINKED':
      targetUrl = '/partner';
      break;
    case 'PARTNER_GOAL_REACHED':
    case 'PARTNER_FOOD_LOGGED':
      targetUrl = '/partner/weekly';
      break;
    case 'APPROVAL_RESULT':
    case 'SUBMISSION_APPROVED':
    case 'SUBMISSION_REJECTED':
      targetUrl = '/partner/submissions';
      break;
    default:
      targetUrl = '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window or open new one
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// Handle generic Web Push events (for native VAPID subscriptions)
self.addEventListener('push', (event) => {
  // Skip if this is a Firebase message (handled by onBackgroundMessage above)
  if (event.data) {
    let payload;
    try {
      payload = event.data.json();
    } catch (e) {
      // Not JSON, try as text
      payload = { notification: { title: 'Eato', body: event.data.text() } };
    }

    // Firebase messages have a specific structure with 'from' field - skip those
    if (payload.from || payload.fcmMessageId) {
      return;
    }

    console.log('[firebase-messaging-sw.js] Web Push message received:', payload);

    const title = payload.title || payload.notification?.title || 'Eato';
    const options = {
      body: payload.body || payload.notification?.body || '',
      icon: '/icons/Icon-192.png',
      badge: '/icons/Icon-maskable-192.png',
      data: payload.data || payload,
      tag: payload.data?.type || payload.type || 'default',
      vibrate: [100, 50, 100],
      requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(clients.claim());
});
