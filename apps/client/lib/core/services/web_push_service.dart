/// Web Push API interop for Flutter web.
/// Provides Dart bindings to the browser Push API via web_push_helper.js.
/// Follows the same @JS() + dart:js_interop pattern as clerk_js_interop.dart.
@JS()
library web_push_service;

import 'dart:convert';
import 'dart:js_interop';

import 'package:flutter/foundation.dart';

/// JS interop bindings

@JS('webPushSubscribe')
external JSPromise<JSString?> _webPushSubscribe(JSString vapidPublicKey);

@JS('webPushUnsubscribe')
external JSPromise<JSBoolean> _webPushUnsubscribe();

@JS('webPushGetSubscription')
external JSPromise<JSString?> _webPushGetSubscription();

@JS('webPushRequestPermission')
external JSPromise<JSString> _webPushRequestPermission();

@JS('webPushGetPermission')
external JSString _webPushGetPermission();

@JS('webPushIsSupported')
external JSBoolean _webPushIsSupported();

/// Represents a Web Push subscription with the keys needed by the backend.
class WebPushSubscription {
  final String endpoint;
  final String p256dh;
  final String auth;

  const WebPushSubscription({
    required this.endpoint,
    required this.p256dh,
    required this.auth,
  });

  factory WebPushSubscription.fromJson(Map<String, dynamic> json) {
    return WebPushSubscription(
      endpoint: json['endpoint'] as String,
      p256dh: json['p256dh'] as String,
      auth: json['auth'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'endpoint': endpoint,
        'p256dh': p256dh,
        'auth': auth,
      };
}

/// Dart wrapper for the Web Push API via JS interop.
class WebPushService {
  /// VAPID public key from compile-time constant (set via --dart-define)
  static const String _vapidPublicKey = String.fromEnvironment(
    'FIREBASE_VAPID_KEY',
    defaultValue: '',
  );

  /// Check if Web Push is supported in this browser
  static bool get isSupported {
    try {
      return _webPushIsSupported().toDart;
    } catch (e) {
      return false;
    }
  }

  /// Get the current notification permission status
  static String getPermission() {
    try {
      return _webPushGetPermission().toDart;
    } catch (e) {
      return 'denied';
    }
  }

  /// Request notification permission from the browser
  static Future<String> requestPermission() async {
    try {
      final result = await _webPushRequestPermission().toDart;
      return result.toDart;
    } catch (e) {
      debugPrint('WebPush: Permission request failed: $e');
      return 'denied';
    }
  }

  /// Subscribe to push notifications. Returns subscription data or null.
  static Future<WebPushSubscription?> subscribe() async {
    if (_vapidPublicKey.isEmpty) {
      debugPrint('WebPush: VAPID public key not set. '
          'Build with: flutter build web --dart-define=FIREBASE_VAPID_KEY=your_key');
      return null;
    }

    try {
      final result =
          await _webPushSubscribe(_vapidPublicKey.toJS).toDart;
      final jsonStr = result?.toDart;
      if (jsonStr == null) return null;

      final data = jsonDecode(jsonStr) as Map<String, dynamic>;
      return WebPushSubscription.fromJson(data);
    } catch (e) {
      debugPrint('WebPush: Subscribe failed: $e');
      return null;
    }
  }

  /// Unsubscribe from push notifications
  static Future<bool> unsubscribe() async {
    try {
      final result = await _webPushUnsubscribe().toDart;
      return result.toDart;
    } catch (e) {
      debugPrint('WebPush: Unsubscribe failed: $e');
      return false;
    }
  }

  /// Get the current subscription if one exists
  static Future<WebPushSubscription?> getSubscription() async {
    try {
      final result = await _webPushGetSubscription().toDart;
      final jsonStr = result?.toDart;
      if (jsonStr == null) return null;

      final data = jsonDecode(jsonStr) as Map<String, dynamic>;
      return WebPushSubscription.fromJson(data);
    } catch (e) {
      debugPrint('WebPush: Get subscription failed: $e');
      return null;
    }
  }
}
