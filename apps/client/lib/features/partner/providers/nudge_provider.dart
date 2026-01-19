import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';

/// State for the nudge feature
class NudgeState {
  final NudgeStatus? lastNudge;
  final bool isSending;
  final bool isLoading;
  final String? error;
  final String? successMessage;

  const NudgeState({
    this.lastNudge,
    this.isSending = false,
    this.isLoading = false,
    this.error,
    this.successMessage,
  });

  NudgeState copyWith({
    NudgeStatus? lastNudge,
    bool? isSending,
    bool? isLoading,
    String? error,
    String? successMessage,
    bool clearLastNudge = false,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return NudgeState(
      lastNudge: clearLastNudge ? null : (lastNudge ?? this.lastNudge),
      isSending: isSending ?? this.isSending,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      successMessage: clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }

  factory NudgeState.initial() => const NudgeState();

  /// Whether the user can send a nudge right now
  bool get canSendNudge => lastNudge?.canSendNudge ?? true;

  /// Cooldown display string
  String get cooldownDisplay => lastNudge?.cooldownDisplay ?? '';
}

/// Nudge state notifier
class NudgeNotifier extends StateNotifier<NudgeState> {
  final ApiClient _apiClient;

  NudgeNotifier(this._apiClient) : super(NudgeState.initial()) {
    loadStatus();
  }

  /// Load the last nudge status
  Future<void> loadStatus() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final data = await _apiClient.getLastNudge();
      if (data != null) {
        final status = NudgeStatus.fromJson(data);
        state = state.copyWith(lastNudge: status, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false, clearLastNudge: true);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load nudge status',
      );
    }
  }

  /// Send a nudge to partner
  Future<bool> sendNudge({String? message}) async {
    state = state.copyWith(isSending: true, clearError: true, clearSuccess: true);

    try {
      final result = await _apiClient.sendNudge(message: message);
      final nudgeResult = NudgeResult.fromJson(result);

      // Reload status to get updated cooldown
      await loadStatus();

      state = state.copyWith(
        isSending: false,
        successMessage: nudgeResult.delivered
            ? 'Nudge sent to ${nudgeResult.partnerName ?? 'your partner'}!'
            : 'Nudge sent (partner may not have notifications enabled)',
      );
      return true;
    } catch (e) {
      String errorMessage = 'Failed to send nudge';

      // Parse error message for cooldown errors
      final errorStr = e.toString();
      if (errorStr.contains('wait') || errorStr.contains('hour')) {
        // Extract the cooldown message from the error
        final match = RegExp(r'Please wait (\d+) more hour').firstMatch(errorStr);
        if (match != null) {
          errorMessage = 'Please wait ${match.group(1)} more hours before nudging again';
        } else {
          errorMessage = 'Please wait before sending another nudge';
        }
      }

      state = state.copyWith(
        isSending: false,
        error: errorMessage,
      );
      return false;
    }
  }

  /// Clear any success/error messages
  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

// Providers

/// Nudge provider
final nudgeProvider = StateNotifierProvider<NudgeNotifier, NudgeState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NudgeNotifier(apiClient);
});

/// Can send nudge provider
final canSendNudgeProvider = Provider<bool>((ref) {
  return ref.watch(nudgeProvider).canSendNudge;
});

/// Nudge cooldown display provider
final nudgeCooldownProvider = Provider<String>((ref) {
  return ref.watch(nudgeProvider).cooldownDisplay;
});
