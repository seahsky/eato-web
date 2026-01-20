import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// Background message handler - must be a top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Initialize Firebase if not already done
  await Firebase.initializeApp();
  debugPrint('Background message: ${message.messageId}');
}

/// Service for handling push notifications via Firebase Cloud Messaging
class PushNotificationService {
  static PushNotificationService? _instance;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  /// VAPID key for web push notifications
  /// Set via: flutter build web --dart-define=FIREBASE_VAPID_KEY=your_key
  static const String _vapidKey = String.fromEnvironment(
    'FIREBASE_VAPID_KEY',
    defaultValue: '',
  );

  StreamController<RemoteMessage>? _messageController;
  StreamController<String>? _tokenController;

  String? _currentToken;
  bool _initialized = false;

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

  /// Current FCM token
  String? get currentToken => _currentToken;

  /// Whether the service has been initialized
  bool get isInitialized => _initialized;

  /// Initialize the push notification service
  Future<void> initialize() async {
    if (_initialized) return;

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
      _messaging.onTokenRefresh.listen((String token) {
        debugPrint('Token refreshed');
        _currentToken = token;
        _tokenController?.add(token);
      });

      // Check if app was opened from a terminated state via notification
      final initialMessage = await _messaging.getInitialMessage();
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
    try {
      final settings = await _messaging.requestPermission(
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

  /// Get the current permission status
  Future<NotificationPermissionStatus> getPermissionStatus() async {
    try {
      final settings = await _messaging.getNotificationSettings();

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

  /// Get the FCM token for this device
  Future<String?> getToken() async {
    try {
      // For web, we need to pass the VAPID key
      // For mobile, no additional parameters needed
      if (kIsWeb) {
        // Use VAPID key from compile-time constant (set via --dart-define)
        _currentToken = await _messaging.getToken(
          vapidKey: _vapidKey.isNotEmpty ? _vapidKey : null,
        );
        if (_vapidKey.isEmpty) {
          debugPrint('Warning: VAPID key not set. Web push may not work.');
          debugPrint('Build with: flutter build web --dart-define=FIREBASE_VAPID_KEY=your_key');
        }
      } else {
        _currentToken = await _messaging.getToken();
      }

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

  /// Delete the FCM token (used when logging out)
  Future<void> deleteToken() async {
    try {
      await _messaging.deleteToken();
      _currentToken = null;
      debugPrint('FCM token deleted');
    } catch (e) {
      debugPrint('Failed to delete token: $e');
    }
  }

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    if (kIsWeb) {
      // Web doesn't support topics in the same way
      debugPrint('Topic subscription not supported on web');
      return;
    }

    try {
      await _messaging.subscribeToTopic(topic);
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
      await _messaging.unsubscribeFromTopic(topic);
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
