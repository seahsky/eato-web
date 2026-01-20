import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';

/// State for partner weekly summary
class PartnerWeeklyState {
  final WeeklySummary? weeklySummary;
  final DateTime weekStartDate;
  final bool isLoading;
  final String? error;

  const PartnerWeeklyState({
    this.weeklySummary,
    required this.weekStartDate,
    this.isLoading = false,
    this.error,
  });

  PartnerWeeklyState copyWith({
    WeeklySummary? weeklySummary,
    DateTime? weekStartDate,
    bool? isLoading,
    String? error,
    bool clearSummary = false,
  }) {
    return PartnerWeeklyState(
      weeklySummary: clearSummary ? null : (weeklySummary ?? this.weeklySummary),
      weekStartDate: weekStartDate ?? this.weekStartDate,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  factory PartnerWeeklyState.initial() {
    // Start from the beginning of the current week (Monday)
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    return PartnerWeeklyState(
      weekStartDate: DateTime(monday.year, monday.month, monday.day),
    );
  }
}

/// Partner weekly summary notifier
class PartnerWeeklyNotifier extends StateNotifier<PartnerWeeklyState> {
  final ApiClient _apiClient;

  PartnerWeeklyNotifier(this._apiClient) : super(PartnerWeeklyState.initial()) {
    loadWeeklySummary();
  }

  /// Load weekly summary for the current week
  Future<void> loadWeeklySummary() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final startDate = DateFormat('yyyy-MM-dd').format(state.weekStartDate);
      final data = await _apiClient.getPartnerWeeklySummary(startDate);
      final summary = WeeklySummary.fromJson(data);
      state = state.copyWith(weeklySummary: summary, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load weekly summary: ${e.toString()}',
      );
    }
  }

  /// Navigate to the previous week
  void previousWeek() {
    final newStart = state.weekStartDate.subtract(const Duration(days: 7));
    state = state.copyWith(weekStartDate: newStart, clearSummary: true);
    loadWeeklySummary();
  }

  /// Navigate to the next week
  void nextWeek() {
    final newStart = state.weekStartDate.add(const Duration(days: 7));
    // Don't go past current week
    final now = DateTime.now();
    final currentMonday = now.subtract(Duration(days: now.weekday - 1));
    final currentWeekStart = DateTime(currentMonday.year, currentMonday.month, currentMonday.day);

    if (newStart.isAfter(currentWeekStart)) {
      return;
    }

    state = state.copyWith(weekStartDate: newStart, clearSummary: true);
    loadWeeklySummary();
  }

  /// Go to the current week
  void goToCurrentWeek() {
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    final currentWeekStart = DateTime(monday.year, monday.month, monday.day);

    if (state.weekStartDate == currentWeekStart) {
      return;
    }

    state = state.copyWith(weekStartDate: currentWeekStart, clearSummary: true);
    loadWeeklySummary();
  }

  /// Refresh the current week's data
  Future<void> refresh() async {
    await loadWeeklySummary();
  }
}

// Providers

/// Partner weekly summary provider
final partnerWeeklyProvider =
    StateNotifierProvider<PartnerWeeklyNotifier, PartnerWeeklyState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PartnerWeeklyNotifier(apiClient);
});

/// Formatted week range provider
final partnerWeekRangeProvider = Provider<String>((ref) {
  final state = ref.watch(partnerWeeklyProvider);
  final startDate = state.weekStartDate;
  final endDate = startDate.add(const Duration(days: 6));

  final startFormat = DateFormat('MMM d');
  final endFormat = DateFormat('MMM d, yyyy');

  return '${startFormat.format(startDate)} - ${endFormat.format(endDate)}';
});

/// Is current week provider
final isPartnerCurrentWeekProvider = Provider<bool>((ref) {
  final state = ref.watch(partnerWeeklyProvider);
  final now = DateTime.now();
  final monday = now.subtract(Duration(days: now.weekday - 1));
  final currentWeekStart = DateTime(monday.year, monday.month, monday.day);
  return state.weekStartDate == currentWeekStart;
});
