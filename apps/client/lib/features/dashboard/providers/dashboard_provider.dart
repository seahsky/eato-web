import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../../core/storage/cache_service.dart';
import '../../auth/providers/auth_provider.dart';

/// State for the dashboard
class DashboardState {
  final DailySummary? dailySummary;
  final DateTime selectedDate;
  final bool isLoading;
  final String? error;
  final bool isOffline;

  const DashboardState({
    this.dailySummary,
    required this.selectedDate,
    this.isLoading = false,
    this.error,
    this.isOffline = false,
  });

  DashboardState copyWith({
    DailySummary? dailySummary,
    DateTime? selectedDate,
    bool? isLoading,
    String? error,
    bool? isOffline,
  }) {
    return DashboardState(
      dailySummary: dailySummary ?? this.dailySummary,
      selectedDate: selectedDate ?? this.selectedDate,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isOffline: isOffline ?? this.isOffline,
    );
  }

  factory DashboardState.initial() => DashboardState(
        selectedDate: DateTime.now(),
      );
}

/// Dashboard state notifier
class DashboardNotifier extends StateNotifier<DashboardState> {
  final ApiClient _apiClient;

  DashboardNotifier(this._apiClient) : super(DashboardState.initial()) {
    // Load today's data on initialization
    loadDailySummary();
  }

  /// Format date for API requests (YYYY-MM-DD)
  String _formatDate(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

  /// Load daily summary for the selected date (cache-first)
  Future<void> loadDailySummary() async {
    final dateStr = _formatDate(state.selectedDate);
    final cache = CacheService.instance;

    // Try to load from cache first for instant display
    final cached = cache.getCachedDailySummary(dateStr);
    if (cached != null) {
      state = state.copyWith(dailySummary: cached, isLoading: true, error: null);
    } else {
      state = state.copyWith(isLoading: true, error: null);
    }

    // Then fetch fresh data from API
    try {
      final data = await _apiClient.getDailySummary(dateStr);
      final summary = DailySummary.fromJson(data);

      // Update state with fresh data and clear offline flag
      state = state.copyWith(
        dailySummary: summary,
        isLoading: false,
        isOffline: false,
      );

      // Cache the fresh data
      await cache.cacheDailySummary(dateStr, summary);
    } catch (e) {
      final isNetworkError = _isNetworkError(e);

      // If we have cached data, show it with offline indicator
      if (cached != null) {
        state = state.copyWith(
          isLoading: false,
          isOffline: isNetworkError,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          isOffline: isNetworkError,
          error: isNetworkError
              ? null
              : 'Failed to load daily summary: ${e.toString()}',
        );
      }
    }
  }

  /// Check if an error is a network/connectivity error
  bool _isNetworkError(Object e) {
    if (e is DioException) {
      return e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.connectionError;
    }
    return false;
  }

  /// Change the selected date and reload data
  Future<void> selectDate(DateTime date) async {
    state = state.copyWith(selectedDate: date);
    await loadDailySummary();
  }

  /// Navigate to the previous day
  Future<void> previousDay() async {
    final newDate = state.selectedDate.subtract(const Duration(days: 1));
    await selectDate(newDate);
  }

  /// Navigate to the next day
  Future<void> nextDay() async {
    final newDate = state.selectedDate.add(const Duration(days: 1));
    await selectDate(newDate);
  }

  /// Navigate to today
  Future<void> goToToday() async {
    await selectDate(DateTime.now());
  }

  /// Refresh the current day's data
  Future<void> refresh() async {
    await loadDailySummary();
  }
}

/// Dashboard provider
final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DashboardNotifier(apiClient);
});

/// Selected date provider for convenience
final selectedDateProvider = Provider<DateTime>((ref) {
  return ref.watch(dashboardProvider).selectedDate;
});

/// Daily summary provider for convenience
final dailySummaryProvider = Provider<DailySummary?>((ref) {
  return ref.watch(dashboardProvider).dailySummary;
});

/// Is loading provider
final isDashboardLoadingProvider = Provider<bool>((ref) {
  return ref.watch(dashboardProvider).isLoading;
});

/// Dashboard error provider
final dashboardErrorProvider = Provider<String?>((ref) {
  return ref.watch(dashboardProvider).error;
});

/// Helper to check if selected date is today
final isSelectedDateTodayProvider = Provider<bool>((ref) {
  final selectedDate = ref.watch(selectedDateProvider);
  final now = DateTime.now();
  return selectedDate.year == now.year &&
         selectedDate.month == now.month &&
         selectedDate.day == now.day;
});

/// Whether the dashboard is showing cached data due to being offline
final isDashboardOfflineProvider = Provider<bool>((ref) {
  return ref.watch(dashboardProvider).isOffline;
});

/// Format selected date for display
final formattedSelectedDateProvider = Provider<String>((ref) {
  final selectedDate = ref.watch(selectedDateProvider);
  final isToday = ref.watch(isSelectedDateTodayProvider);

  if (isToday) {
    return 'Today';
  }

  final now = DateTime.now();
  final yesterday = now.subtract(const Duration(days: 1));

  if (selectedDate.year == yesterday.year &&
      selectedDate.month == yesterday.month &&
      selectedDate.day == yesterday.day) {
    return 'Yesterday';
  }

  return DateFormat('EEEE, MMM d').format(selectedDate);
});
