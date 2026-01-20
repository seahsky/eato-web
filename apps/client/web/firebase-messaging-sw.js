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

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(clients.claim());
});
