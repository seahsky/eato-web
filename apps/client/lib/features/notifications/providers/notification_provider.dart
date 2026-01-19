import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../../core/services/push_notification_service.dart';
import '../../auth/providers/auth_provider.dart';

/// State for notification management
class NotificationState {
  final NotificationPermissionStatus permissionStatus;
  final NotificationSettings? settings;
  final bool isLoading;
  final bool isRegistering;
  final String? error;
  final bool hasSubscription;

  const NotificationState({
    this.permissionStatus = NotificationPermissionStatus.notDetermined,
    this.settings,
    this.isLoading = false,
    this.isRegistering = false,
    this.error,
    this.hasSubscription = false,
  });

  NotificationState copyWith({
    NotificationPermissionStatus? permissionStatus,
    NotificationSettings? settings,
    bool? isLoading,
    bool? isRegistering,
    String? error,
    bool? hasSubscription,
    bool clearError = false,
  }) {
    return NotificationState(
      permissionStatus: permissionStatus ?? this.permissionStatus,
      settings: settings ?? this.settings,
      isLoading: isLoading ?? this.isLoading,
      isRegistering: isRegistering ?? this.isRegistering,
      error: clearError ? null : (error ?? this.error),
      hasSubscription: hasSubscription ?? this.hasSubscription,
    );
  }

  factory NotificationState.initial() => const NotificationState();

  /// Whether notifications are fully enabled
  bool get isEnabled =>
      permissionStatus == NotificationPermissionStatus.granted &&
      hasSubscription;
}

/// Notification state notifier
class NotificationNotifier extends StateNotifier<NotificationState> {
  final ApiClient _apiClient;
  final PushNotificationService _pushService;

  NotificationNotifier(this._apiClient, this._pushService)
      : super(NotificationState.initial()) {
    _initialize();
  }

  Future<void> _initialize() async {
    await _pushService.initialize();
    await checkPermissionStatus();
    await checkSubscription();
  }

  /// Check current permission status
  Future<void> checkPermissionStatus() async {
    final status = await _pushService.getPermissionStatus();
    state = state.copyWith(permissionStatus: status);
  }

  /// Check if user has an active subscription
  Future<void> checkSubscription() async {
    try {
      final hasSubscription = await _apiClient.hasNotificationSubscription();
      state = state.copyWith(hasSubscription: hasSubscription);
    } catch (e) {
      // Silently fail - subscription check is optional
    }
  }

  /// Request notification permission and register with backend
  Future<bool> requestPermissionAndRegister() async {
    state = state.copyWith(isRegistering: true, clearError: true);

    try {
      // Request permission
      final status = await _pushService.requestPermission();
      state = state.copyWith(permissionStatus: status);

      if (status != NotificationPermissionStatus.granted &&
          status != NotificationPermissionStatus.provisional) {
        state = state.copyWith(
          isRegistering: false,
          error: 'Notification permission denied',
        );
        return false;
      }

      // Get FCM token
      final token = await _pushService.getToken();
      if (token == null) {
        state = state.copyWith(
          isRegistering: false,
          error: 'Failed to get notification token',
        );
        return false;
      }

      // Register with backend
      // Note: For FCM, we use the Expo-style registration since the backend
      // expects ExponentPushToken format. For production, you may want to
      // update the backend to handle FCM tokens directly.
      await _apiClient.subscribeExpoNotifications(
        expoToken: 'ExponentPushToken[$token]',
      );

      state = state.copyWith(
        isRegistering: false,
        hasSubscription: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isRegistering: false,
        error: 'Failed to register for notifications: ${e.toString()}',
      );
      return false;
    }
  }

  /// Load notification settings from backend
  Future<void> loadSettings() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final data = await _apiClient.getNotificationSettings();
      final settings = NotificationSettings.fromJson(data);
      state = state.copyWith(
        settings: settings,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load settings: ${e.toString()}',
      );
    }
  }

  /// Update notification settings
  Future<bool> updateSettings(NotificationSettings newSettings) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      await _apiClient.updateNotificationSettings(newSettings.toJson());
      state = state.copyWith(
        settings: newSettings,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to update settings: ${e.toString()}',
      );
      return false;
    }
  }

  /// Unregister from notifications
  Future<void> unregister() async {
    try {
      final token = _pushService.currentToken;
      if (token != null) {
        await _apiClient.unsubscribeNotifications(
          expoToken: 'ExponentPushToken[$token]',
        );
      }
      await _pushService.deleteToken();
      state = state.copyWith(hasSubscription: false);
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to unregister: ${e.toString()}',
      );
    }
  }
}

// Providers

/// Push notification service provider
final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService();
});

/// Notification provider
final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final pushService = ref.watch(pushNotificationServiceProvider);
  return NotificationNotifier(apiClient, pushService);
});

/// Permission status provider
final notificationPermissionProvider = Provider<NotificationPermissionStatus>((ref) {
  return ref.watch(notificationProvider).permissionStatus;
});

/// Has notification subscription provider
final hasNotificationSubscriptionProvider = Provider<bool>((ref) {
  return ref.watch(notificationProvider).hasSubscription;
});

/// Notification settings provider
final notificationSettingsProvider = Provider<NotificationSettings?>((ref) {
  return ref.watch(notificationProvider).settings;
});
