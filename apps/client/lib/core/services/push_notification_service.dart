import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'web_push_service.dart';

/// Background message handler - must be a top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Initialize Firebase if not already done
  await Firebase.initializeApp();
  debugPrint('Background message: ${message.messageId}');
}

/// Service for handling push notifications.
/// On native platforms, uses Firebase Cloud Messaging.
/// On web, uses the native browser Push API via WebPushService.
class PushNotificationService {
  static PushNotificationService? _instance;

  // Lazy initialization to avoid accessing FirebaseMessaging.instance on web
  // where Firebase may not be initialized
  FirebaseMessaging? _messaging;
  FirebaseMessaging get _getMessaging {
    _messaging ??= FirebaseMessaging.instance;
    return _messaging!;
  }

  StreamController<RemoteMessage>? _messageController;
  StreamController<String>? _tokenController;

  String? _currentToken;
  bool _initialized = false;

  /// Web Push subscription data (only used on web)
  WebPushSubscription? _webPushSubscription;

  PushNotificationService._internal();

  factory PushNotificationService() {
    _instance ??= PushNotificationService._internal();
    return _instance!;
  }

  /// Stream of incoming messages when app is in foreground
  Stream<RemoteMessage> get onMessage {
    _messageController ??= StreamController<RemoteMessage>.broadcast();
    return _messageController!.stream;
  }

  /// Stream of token refreshes
  Stream<String> get onTokenRefresh {
    _tokenController ??= StreamController<String>.broadcast();
    return _tokenController!.stream;
  }

  /// Current FCM token (native) or endpoint identifier (web)
  String? get currentToken => _currentToken;

  /// Whether the service has been initialized
  bool get isInitialized => _initialized;

  /// Whether we're running on web with Web Push
  bool get isWebPush => kIsWeb;

  /// The current web push subscription (only available on web)
  WebPushSubscription? get webPushSubscription => _webPushSubscription;

  /// Initialize the push notification service
  Future<void> initialize() async {
    if (_initialized) return;

    if (kIsWeb) {
      // On web, use native Push API - no Firebase initialization needed
      _initialized = true;
      debugPrint('Push notifications: Web Push API mode');
      return;
    }

    try {
      // Set up background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Foreground message: ${message.notification?.title}');
        _messageController?.add(message);
      });

      // Handle when app is opened from notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('Opened from notification: ${message.data}');
        _messageController?.add(message);
      });

      // Listen for token refreshes
      _getMessaging.onTokenRefresh.listen((String token) {
        debugPrint('Token refreshed');
        _currentToken = token;
        _tokenController?.add(token);
      });

      // Check if app was opened from a terminated state via notification
      final initialMessage = await _getMessaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('App opened from terminated state via notification');
        _messageController?.add(initialMessage);
      }

      _initialized = true;
      debugPrint('Push notification service initialized');
    } catch (e) {
      debugPrint('Failed to initialize push notifications: $e');
    }
  }

  /// Request notification permissions from the user
  Future<NotificationPermissionStatus> requestPermission() async {
    if (kIsWeb) {
      return _requestWebPermission();
    }

    try {
      final settings = await _getMessaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      debugPrint('Permission status: ${settings.authorizationStatus}');

      switch (settings.authorizationStatus) {
        case AuthorizationStatus.authorized:
          return NotificationPermissionStatus.granted;
        case AuthorizationStatus.denied:
          return NotificationPermissionStatus.denied;
        case AuthorizationStatus.notDetermined:
          return NotificationPermissionStatus.notDetermined;
        case AuthorizationStatus.provisional:
          return NotificationPermissionStatus.provisional;
      }
    } catch (e) {
      debugPrint('Failed to request permission: $e');
      return NotificationPermissionStatus.denied;
    }
  }

  /// Request permission on web using the browser Notification API
  Future<NotificationPermissionStatus> _requestWebPermission() async {
    if (!WebPushService.isSupported) {
      return NotificationPermissionStatus.denied;
    }

    final result = await WebPushService.requestPermission();
    switch (result) {
      case 'granted':
        return NotificationPermissionStatus.granted;
      case 'denied':
        return NotificationPermissionStatus.denied;
      default:
        return NotificationPermissionStatus.notDetermined;
    }
  }

  /// Get the current permission status
  Future<NotificationPermissionStatus> getPermissionStatus() async {
    if (kIsWeb) {
      return _getWebPermissionStatus();
    }

    try {
      final settings = await _getMessaging.getNotificationSettings();

      switch (settings.authorizationStatus) {
        case AuthorizationStatus.authorized:
          return NotificationPermissionStatus.granted;
        case AuthorizationStatus.denied:
          return NotificationPermissionStatus.denied;
        case AuthorizationStatus.notDetermined:
          return NotificationPermissionStatus.notDetermined;
        case AuthorizationStatus.provisional:
          return NotificationPermissionStatus.provisional;
      }
    } catch (e) {
      debugPrint('Failed to get permission status: $e');
      return NotificationPermissionStatus.notDetermined;
    }
  }

  /// Get permission status on web
  Future<NotificationPermissionStatus> _getWebPermissionStatus() async {
    if (!WebPushService.isSupported) {
      return NotificationPermissionStatus.denied;
    }

    final permission = WebPushService.getPermission();
    switch (permission) {
      case 'granted':
        return NotificationPermissionStatus.granted;
      case 'denied':
        return NotificationPermissionStatus.denied;
      default:
        return NotificationPermissionStatus.notDetermined;
    }
  }

  /// Get the push token/subscription.
  /// On native, returns an FCM token string.
  /// On web, subscribes via Push API and stores the WebPushSubscription.
  Future<String?> getToken() async {
    if (kIsWeb) {
      return _getWebPushToken();
    }

    try {
      _currentToken = await _getMessaging.getToken();

      if (_currentToken != null && _currentToken!.length > 20) {
        debugPrint('FCM Token obtained: ${_currentToken!.substring(0, 20)}...');
      } else {
        debugPrint('FCM Token obtained: $_currentToken');
      }
      return _currentToken;
    } catch (e) {
      debugPrint('Failed to get FCM token: $e');
      return null;
    }
  }

  /// Subscribe to Web Push and return the endpoint as the "token" identifier
  Future<String?> _getWebPushToken() async {
    final subscription = await WebPushService.subscribe();
    if (subscription == null) return null;

    _webPushSubscription = subscription;
    _currentToken = subscription.endpoint;

    debugPrint('Web Push subscription obtained');
    return _currentToken;
  }

  /// Delete the push token/subscription
  Future<void> deleteToken() async {
    if (kIsWeb) {
      await WebPushService.unsubscribe();
      _webPushSubscription = null;
      _currentToken = null;
      debugPrint('Web Push subscription deleted');
      return;
    }

    try {
      await _getMessaging.deleteToken();
      _currentToken = null;
      debugPrint('FCM token deleted');
    } catch (e) {
      debugPrint('Failed to delete token: $e');
    }
  }

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    if (kIsWeb) {
      debugPrint('Topic subscription not supported on web');
      return;
    }

    try {
      await _getMessaging.subscribeToTopic(topic);
      debugPrint('Subscribed to topic: $topic');
    } catch (e) {
      debugPrint('Failed to subscribe to topic: $e');
    }
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    if (kIsWeb) {
      debugPrint('Topic unsubscription not supported on web');
      return;
    }

    try {
      await _getMessaging.unsubscribeFromTopic(topic);
      debugPrint('Unsubscribed from topic: $topic');
    } catch (e) {
      debugPrint('Failed to unsubscribe from topic: $e');
    }
  }

  /// Clean up resources
  void dispose() {
    _messageController?.close();
    _tokenController?.close();
  }
}

/// Permission status for notifications
enum NotificationPermissionStatus {
  /// Permission has been granted
  granted,

  /// Permission has been denied
  denied,

  /// Permission has not been requested yet
  notDetermined,

  /// Provisional permission (iOS only)
  provisional,
}
