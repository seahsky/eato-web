import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';

/// State for all achievements/badges
class AchievementsState {
  final AchievementsResponse? data;
  final bool isLoading;
  final String? error;

  const AchievementsState({
    this.data,
    this.isLoading = false,
    this.error,
  });

  AchievementsState copyWith({
    AchievementsResponse? data,
    bool? isLoading,
    String? error,
  }) {
    return AchievementsState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  factory AchievementsState.initial() => const AchievementsState();

  /// Quick accessors
  List<Badge> get unlockedBadges => data?.unlockedBadges ?? [];
  List<Badge> get allBadges => data?.allBadges ?? [];
  int get unlockedCount => data?.unlockedCount ?? 0;
  int get totalBadges => data?.totalBadges ?? 0;
  double get progressPercent => totalBadges > 0 ? unlockedCount / totalBadges : 0;
}

/// Achievements notifier
class AchievementsNotifier extends StateNotifier<AchievementsState> {
  final ApiClient _apiClient;

  AchievementsNotifier(this._apiClient) : super(AchievementsState.initial());

  /// Fetch all achievements
  Future<void> fetch() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final json = await _apiClient.getAllAchievements();
      final data = AchievementsResponse.fromJson(json);
      state = state.copyWith(data: data, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load achievements: ${e.toString()}',
      );
    }
  }

  /// Refresh achievements
  Future<void> refresh() => fetch();
}

/// State for badges by category
class BadgesByCategoryState {
  final BadgesByCategory? data;
  final bool isLoading;
  final String? error;

  const BadgesByCategoryState({
    this.data,
    this.isLoading = false,
    this.error,
  });

  BadgesByCategoryState copyWith({
    BadgesByCategory? data,
    bool? isLoading,
    String? error,
  }) {
    return BadgesByCategoryState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Badges by category notifier
class BadgesByCategoryNotifier extends StateNotifier<BadgesByCategoryState> {
  final ApiClient _apiClient;

  BadgesByCategoryNotifier(this._apiClient)
      : super(const BadgesByCategoryState());

  /// Fetch badges grouped by category
  Future<void> fetch() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final json = await _apiClient.getAchievementsByCategory();
      final data = BadgesByCategory.fromJson(json);
      state = state.copyWith(data: data, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load badges: ${e.toString()}',
      );
    }
  }

  /// Refresh
  Future<void> refresh() => fetch();
}

/// State for achievement summary (profile display)
class AchievementSummaryState {
  final AchievementSummary? data;
  final bool isLoading;
  final String? error;

  const AchievementSummaryState({
    this.data,
    this.isLoading = false,
    this.error,
  });

  AchievementSummaryState copyWith({
    AchievementSummary? data,
    bool? isLoading,
    String? error,
  }) {
    return AchievementSummaryState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  factory AchievementSummaryState.initial() => const AchievementSummaryState();

  /// Quick accessors with defaults
  int get currentStreak => data?.currentStreak ?? 0;
  int get longestStreak => data?.longestStreak ?? 0;
  int get badgeCount => data?.badgeCount ?? 0;
  int get totalBadges => data?.totalBadges ?? 0;
  AvatarFrame get avatarFrame => data?.avatarFrame ?? AvatarFrame.none;
}

/// Achievement summary notifier
class AchievementSummaryNotifier extends StateNotifier<AchievementSummaryState> {
  final ApiClient _apiClient;

  AchievementSummaryNotifier(this._apiClient)
      : super(AchievementSummaryState.initial());

  /// Fetch summary
  Future<void> fetch() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final json = await _apiClient.getAchievementSummary();
      final data = AchievementSummary.fromJson(json);
      state = state.copyWith(data: data, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load summary: ${e.toString()}',
      );
    }
  }

  /// Refresh
  Future<void> refresh() => fetch();
}

/// State for recent achievements (notifications/toasts)
class RecentAchievementsState {
  final List<Badge> badges;
  final bool isLoading;
  final String? error;
  final bool hasUnseen;

  const RecentAchievementsState({
    this.badges = const [],
    this.isLoading = false,
    this.error,
    this.hasUnseen = false,
  });

  RecentAchievementsState copyWith({
    List<Badge>? badges,
    bool? isLoading,
    String? error,
    bool? hasUnseen,
  }) {
    return RecentAchievementsState(
      badges: badges ?? this.badges,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      hasUnseen: hasUnseen ?? this.hasUnseen,
    );
  }
}

/// Recent achievements notifier
class RecentAchievementsNotifier extends StateNotifier<RecentAchievementsState> {
  final ApiClient _apiClient;

  RecentAchievementsNotifier(this._apiClient)
      : super(const RecentAchievementsState());

  /// Fetch recent achievements (last 24 hours)
  Future<void> fetch() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final data = await _apiClient.getRecentAchievements();
      final badges = data
          .map((item) => Badge.fromJson(item as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        badges: badges,
        isLoading: false,
        hasUnseen: badges.isNotEmpty,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load recent achievements: ${e.toString()}',
      );
    }
  }

  /// Mark all as seen
  void markAsSeen() {
    state = state.copyWith(hasUnseen: false);
  }

  /// Refresh
  Future<void> refresh() => fetch();
}

/// State for partner achievements comparison
class PartnerAchievementsState {
  final PartnerAchievements? data;
  final bool isLoading;
  final String? error;

  const PartnerAchievementsState({
    this.data,
    this.isLoading = false,
    this.error,
  });

  PartnerAchievementsState copyWith({
    PartnerAchievements? data,
    bool? isLoading,
    String? error,
  }) {
    return PartnerAchievementsState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Partner achievements notifier
class PartnerAchievementsNotifier extends StateNotifier<PartnerAchievementsState> {
  final ApiClient _apiClient;

  PartnerAchievementsNotifier(this._apiClient)
      : super(const PartnerAchievementsState());

  /// Fetch partner achievements comparison
  Future<void> fetch() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final json = await _apiClient.getPartnerAchievements();
      if (json == null) {
        state = state.copyWith(data: null, isLoading: false);
        return;
      }
      final data = PartnerAchievements.fromJson(json);
      state = state.copyWith(data: data, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load partner achievements: ${e.toString()}',
      );
    }
  }

  /// Refresh
  Future<void> refresh() => fetch();
}

/// State for full streak data
class StreakState {
  final StreakData? data;
  final bool isLoading;
  final String? error;

  const StreakState({
    this.data,
    this.isLoading = false,
    this.error,
  });

  StreakState copyWith({
    StreakData? data,
    bool? isLoading,
    String? error,
  }) {
    return StreakState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  factory StreakState.initial() => const StreakState();

  /// Quick accessors
  int get currentStreak => data?.currentStreak ?? 0;
  int get longestStreak => data?.longestStreak ?? 0;
  int get goalStreak => data?.goalStreak ?? 0;
  int get streakFreezes => data?.streakFreezes ?? 0;
  int get weeklyStreak => data?.weeklyStreak ?? 0;
  int get currentWeekDays => data?.currentWeekDays ?? 0;
  int get restDaysRemaining => data?.restDaysRemaining ?? 6;
  int get partnerShields => data?.partnerShields ?? 2;
  int? get nextMilestone => data?.nextMilestone;
  double get milestoneProgress => data?.milestoneProgress ?? 0;
  double get weeklyProgress => data?.weeklyProgress ?? 0;
  String get flameSize => data?.flameSize ?? 'none';
}

/// Streak notifier
class StreakNotifier extends StateNotifier<StreakState> {
  final ApiClient _apiClient;

  StreakNotifier(this._apiClient) : super(StreakState.initial());

  /// Fetch full streak data
  Future<void> fetch() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final json = await _apiClient.getStreakData();
      final data = StreakData.fromJson(json);
      state = state.copyWith(data: data, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load streak data: ${e.toString()}',
      );
    }
  }

  /// Refresh streak data
  Future<void> refresh() => fetch();
}

/// State for partner streak data
class PartnerStreakState {
  final StreakData? data;
  final bool isLoading;
  final String? error;

  const PartnerStreakState({
    this.data,
    this.isLoading = false,
    this.error,
  });

  PartnerStreakState copyWith({
    StreakData? data,
    bool? isLoading,
    String? error,
  }) {
    return PartnerStreakState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Partner streak notifier
class PartnerStreakNotifier extends StateNotifier<PartnerStreakState> {
  final ApiClient _apiClient;

  PartnerStreakNotifier(this._apiClient) : super(const PartnerStreakState());

  /// Fetch partner's streak data
  Future<void> fetch() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final json = await _apiClient.getPartnerStreakData();
      if (json == null) {
        state = state.copyWith(data: null, isLoading: false);
        return;
      }
      final data = StreakData.fromJson(json);
      state = state.copyWith(data: data, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load partner streak: ${e.toString()}',
      );
    }
  }

  /// Refresh
  Future<void> refresh() => fetch();
}

// Providers

/// Full streak data provider
final streakProvider =
    StateNotifierProvider<StreakNotifier, StreakState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return StreakNotifier(apiClient);
});

/// Partner streak data provider
final partnerStreakProvider =
    StateNotifierProvider<PartnerStreakNotifier, PartnerStreakState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PartnerStreakNotifier(apiClient);
});

/// All achievements provider
final achievementsProvider =
    StateNotifierProvider<AchievementsNotifier, AchievementsState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AchievementsNotifier(apiClient);
});

/// Badges by category provider
final badgesByCategoryProvider =
    StateNotifierProvider<BadgesByCategoryNotifier, BadgesByCategoryState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return BadgesByCategoryNotifier(apiClient);
});

/// Achievement summary provider
final achievementSummaryProvider =
    StateNotifierProvider<AchievementSummaryNotifier, AchievementSummaryState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AchievementSummaryNotifier(apiClient);
});

/// Recent achievements provider
final recentAchievementsProvider =
    StateNotifierProvider<RecentAchievementsNotifier, RecentAchievementsState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RecentAchievementsNotifier(apiClient);
});

/// Partner achievements provider
final partnerAchievementsProvider =
    StateNotifierProvider<PartnerAchievementsNotifier, PartnerAchievementsState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PartnerAchievementsNotifier(apiClient);
});

/// Current streak convenience provider
final currentStreakProvider = Provider<int>((ref) {
  return ref.watch(achievementSummaryProvider).currentStreak;
});

/// Longest streak convenience provider
final longestStreakProvider = Provider<int>((ref) {
  return ref.watch(achievementSummaryProvider).longestStreak;
});

/// Badge count convenience provider
final badgeCountProvider = Provider<int>((ref) {
  return ref.watch(achievementSummaryProvider).badgeCount;
});

/// Has unseen achievements convenience provider
final hasUnseenAchievementsProvider = Provider<bool>((ref) {
  return ref.watch(recentAchievementsProvider).hasUnseen;
});
