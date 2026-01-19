import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';

/// State for the partner feature
class PartnerViewState {
  final Partner? partner;
  final String? linkCode;
  final DateTime? codeExpiresAt;
  final DailySummary? partnerDailySummary;
  final bool isLoading;
  final bool isGeneratingCode;
  final bool isLinking;
  final String? error;

  const PartnerViewState({
    this.partner,
    this.linkCode,
    this.codeExpiresAt,
    this.partnerDailySummary,
    this.isLoading = false,
    this.isGeneratingCode = false,
    this.isLinking = false,
    this.error,
  });

  PartnerViewState copyWith({
    Partner? partner,
    String? linkCode,
    DateTime? codeExpiresAt,
    DailySummary? partnerDailySummary,
    bool? isLoading,
    bool? isGeneratingCode,
    bool? isLinking,
    String? error,
    bool clearPartner = false,
    bool clearLinkCode = false,
  }) {
    return PartnerViewState(
      partner: clearPartner ? null : (partner ?? this.partner),
      linkCode: clearLinkCode ? null : (linkCode ?? this.linkCode),
      codeExpiresAt: clearLinkCode ? null : (codeExpiresAt ?? this.codeExpiresAt),
      partnerDailySummary: clearPartner ? null : (partnerDailySummary ?? this.partnerDailySummary),
      isLoading: isLoading ?? this.isLoading,
      isGeneratingCode: isGeneratingCode ?? this.isGeneratingCode,
      isLinking: isLinking ?? this.isLinking,
      error: error,
    );
  }

  factory PartnerViewState.initial() => const PartnerViewState();

  bool get hasPartner => partner != null;
  bool get hasValidCode => linkCode != null &&
      codeExpiresAt != null &&
      DateTime.now().isBefore(codeExpiresAt!);
}

/// Partner state notifier
class PartnerNotifier extends StateNotifier<PartnerViewState> {
  final ApiClient _apiClient;
  final Ref _ref;

  PartnerNotifier(this._apiClient, this._ref) : super(PartnerViewState.initial()) {
    _loadPartnerFromAuth();
  }

  /// Load partner info from auth state
  void _loadPartnerFromAuth() {
    final user = _ref.read(currentUserProvider);
    if (user?.partnerId != null) {
      _loadPartnerDetails();
    }
  }

  /// Load partner details and their daily summary
  Future<void> _loadPartnerDetails() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Get current user with partner info
      final userData = await _apiClient.getCurrentUser();

      // Check if user has a partner
      final partnerId = userData['partnerId'] as String?;
      if (partnerId == null) {
        state = state.copyWith(isLoading: false, clearPartner: true);
        return;
      }

      // Partner info should be included in the user response
      final partnerData = userData['partner'] as Map<String, dynamic>?;
      if (partnerData != null) {
        final partner = Partner.fromJson(partnerData);
        state = state.copyWith(partner: partner);

        // Load partner's daily summary
        await _loadPartnerDailySummary();
      }

      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load partner: ${e.toString()}',
      );
    }
  }

  /// Load partner's daily summary for today
  Future<void> _loadPartnerDailySummary() async {
    try {
      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final data = await _apiClient.getPartnerDailySummary(today);
      final summary = DailySummary.fromJson(data);
      state = state.copyWith(partnerDailySummary: summary);
    } catch (e) {
      // Partner summary is optional, don't fail the whole load
    }
  }

  /// Generate a new partner link code
  Future<void> generateLinkCode() async {
    state = state.copyWith(isGeneratingCode: true, error: null);

    try {
      final code = await _apiClient.generatePartnerCode();
      final expiresAt = DateTime.now().add(const Duration(hours: 24));
      state = state.copyWith(
        linkCode: code,
        codeExpiresAt: expiresAt,
        isGeneratingCode: false,
      );
    } catch (e) {
      state = state.copyWith(
        isGeneratingCode: false,
        error: 'Failed to generate code: ${e.toString()}',
      );
    }
  }

  /// Link with a partner using their code
  Future<bool> linkPartner(String code) async {
    state = state.copyWith(isLinking: true, error: null);

    try {
      await _apiClient.linkPartner(code);

      // Refresh auth state to get updated partner info
      await _ref.read(authProvider.notifier).refreshUser();

      // Load partner details
      await _loadPartnerDetails();

      state = state.copyWith(isLinking: false, clearLinkCode: true);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLinking: false,
        error: 'Failed to link partner: ${e.toString()}',
      );
      return false;
    }
  }

  /// Unlink from current partner
  Future<bool> unlinkPartner() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _apiClient.unlinkPartner();

      // Refresh auth state
      await _ref.read(authProvider.notifier).refreshUser();

      state = state.copyWith(
        isLoading: false,
        clearPartner: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to unlink partner: ${e.toString()}',
      );
      return false;
    }
  }

  /// Refresh partner data
  Future<void> refresh() async {
    await _loadPartnerDetails();
  }
}

// Providers

/// Partner provider
final partnerProvider =
    StateNotifierProvider<PartnerNotifier, PartnerViewState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PartnerNotifier(apiClient, ref);
});

/// Has partner provider for convenience
final hasPartnerProvider = Provider<bool>((ref) {
  return ref.watch(partnerProvider).hasPartner;
});

/// Partner info provider
final partnerInfoProvider = Provider<Partner?>((ref) {
  return ref.watch(partnerProvider).partner;
});

/// Partner link code provider
final partnerLinkCodeProvider = Provider<String?>((ref) {
  return ref.watch(partnerProvider).linkCode;
});

/// Partner daily summary provider
final partnerDailySummaryProvider = Provider<DailySummary?>((ref) {
  return ref.watch(partnerProvider).partnerDailySummary;
});

/// Is linking partner provider
final isLinkingPartnerProvider = Provider<bool>((ref) {
  return ref.watch(partnerProvider).isLinking;
});
