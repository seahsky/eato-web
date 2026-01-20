import 'package:json_annotation/json_annotation.dart';

part 'gamification.g.dart';

/// Badge category types
enum BadgeCategory {
  consistency,
  logging,
  goals,
  partner;

  String get displayName {
    switch (this) {
      case BadgeCategory.consistency:
        return 'Consistency';
      case BadgeCategory.logging:
        return 'Logging';
      case BadgeCategory.goals:
        return 'Goals';
      case BadgeCategory.partner:
        return 'Partner';
    }
  }

  String get description {
    switch (this) {
      case BadgeCategory.consistency:
        return 'Maintain logging streaks';
      case BadgeCategory.logging:
        return 'Track your food intake';
      case BadgeCategory.goals:
        return 'Hit your calorie goals';
      case BadgeCategory.partner:
        return 'Work together';
    }
  }
}

/// Badge rarity levels
enum BadgeRarity {
  common,
  uncommon,
  rare,
  epic,
  legendary;

  String get displayName {
    switch (this) {
      case BadgeRarity.common:
        return 'Common';
      case BadgeRarity.uncommon:
        return 'Uncommon';
      case BadgeRarity.rare:
        return 'Rare';
      case BadgeRarity.epic:
        return 'Epic';
      case BadgeRarity.legendary:
        return 'Legendary';
    }
  }

  /// Color value for UI display (hex without #)
  int get colorValue {
    switch (this) {
      case BadgeRarity.common:
        return 0xFF9E9E9E; // Grey
      case BadgeRarity.uncommon:
        return 0xFF4CAF50; // Green
      case BadgeRarity.rare:
        return 0xFF2196F3; // Blue
      case BadgeRarity.epic:
        return 0xFF9C27B0; // Purple
      case BadgeRarity.legendary:
        return 0xFFFF9800; // Orange/Gold
    }
  }
}

/// Avatar frame types
enum AvatarFrame {
  none,
  bronze,
  silver,
  gold,
  diamond;

  String get displayName {
    switch (this) {
      case AvatarFrame.none:
        return 'None';
      case AvatarFrame.bronze:
        return 'Bronze';
      case AvatarFrame.silver:
        return 'Silver';
      case AvatarFrame.gold:
        return 'Gold';
      case AvatarFrame.diamond:
        return 'Diamond';
    }
  }

  /// Minimum badge count required
  int get requiredBadges {
    switch (this) {
      case AvatarFrame.none:
        return 0;
      case AvatarFrame.bronze:
        return 5;
      case AvatarFrame.silver:
        return 15;
      case AvatarFrame.gold:
        return 30;
      case AvatarFrame.diamond:
        return 30; // Total badge count
    }
  }
}

/// Theme ID types
enum ThemeId {
  @JsonValue('default')
  defaultTheme,
  midnight,
  ocean,
  forest,
  sunset;

  String get displayName {
    switch (this) {
      case ThemeId.defaultTheme:
        return 'Default';
      case ThemeId.midnight:
        return 'Midnight';
      case ThemeId.ocean:
        return 'Ocean';
      case ThemeId.forest:
        return 'Forest';
      case ThemeId.sunset:
        return 'Sunset';
    }
  }

  /// Minimum streak required to unlock
  int get requiredStreak {
    switch (this) {
      case ThemeId.defaultTheme:
        return 0;
      case ThemeId.midnight:
        return 7;
      case ThemeId.ocean:
        return 30;
      case ThemeId.forest:
        return 60;
      case ThemeId.sunset:
        return 90;
    }
  }
}

/// Badge definition
@JsonSerializable()
class Badge {
  final String id;
  final String name;
  final String description;
  final BadgeCategory category;
  final String icon;
  final String requirement;
  final BadgeRarity rarity;
  final int order;
  final bool? unlocked;
  final DateTime? unlockedAt;

  const Badge({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.icon,
    required this.requirement,
    required this.rarity,
    required this.order,
    this.unlocked,
    this.unlockedAt,
  });

  factory Badge.fromJson(Map<String, dynamic> json) => _$BadgeFromJson(json);
  Map<String, dynamic> toJson() => _$BadgeToJson(this);
}

/// Full achievements response
@JsonSerializable()
class AchievementsResponse {
  final List<Badge> unlockedBadges;
  final List<Badge> allBadges;
  final int totalBadges;
  final int unlockedCount;
  final AvatarFrame avatarFrame;
  final AvatarFrame currentAvatarFrame;
  final List<ThemeId> unlockedThemes;
  final ThemeId currentTheme;

  const AchievementsResponse({
    this.unlockedBadges = const [],
    this.allBadges = const [],
    required this.totalBadges,
    required this.unlockedCount,
    required this.avatarFrame,
    required this.currentAvatarFrame,
    this.unlockedThemes = const [],
    required this.currentTheme,
  });

  factory AchievementsResponse.fromJson(Map<String, dynamic> json) =>
      _$AchievementsResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AchievementsResponseToJson(this);
}

/// Badges grouped by category
@JsonSerializable()
class BadgesByCategory {
  final List<Badge> consistency;
  final List<Badge> logging;
  final List<Badge> goals;
  final List<Badge> partner;

  const BadgesByCategory({
    this.consistency = const [],
    this.logging = const [],
    this.goals = const [],
    this.partner = const [],
  });

  factory BadgesByCategory.fromJson(Map<String, dynamic> json) =>
      _$BadgesByCategoryFromJson(json);
  Map<String, dynamic> toJson() => _$BadgesByCategoryToJson(this);

  List<Badge> forCategory(BadgeCategory category) {
    switch (category) {
      case BadgeCategory.consistency:
        return consistency;
      case BadgeCategory.logging:
        return logging;
      case BadgeCategory.goals:
        return goals;
      case BadgeCategory.partner:
        return partner;
    }
  }
}

/// Achievement summary for profile display
@JsonSerializable()
class AchievementSummary {
  final int badgeCount;
  final int totalBadges;
  final AvatarFrame avatarFrame;
  final AvatarFrame currentAvatarFrame;
  final int currentStreak;
  final int longestStreak;

  const AchievementSummary({
    required this.badgeCount,
    required this.totalBadges,
    required this.avatarFrame,
    required this.currentAvatarFrame,
    required this.currentStreak,
    required this.longestStreak,
  });

  factory AchievementSummary.fromJson(Map<String, dynamic> json) =>
      _$AchievementSummaryFromJson(json);
  Map<String, dynamic> toJson() => _$AchievementSummaryToJson(this);

  double get progressPercent => totalBadges > 0 ? badgeCount / totalBadges : 0;
}

/// Partner achievements comparison
@JsonSerializable()
class PartnerAchievements {
  final String partnerName;
  final List<PartnerAchievementEntry> userAchievements;
  final List<PartnerAchievementEntry> partnerAchievements;
  final int userCount;
  final int partnerCount;
  final int sharedCount;

  const PartnerAchievements({
    required this.partnerName,
    this.userAchievements = const [],
    this.partnerAchievements = const [],
    required this.userCount,
    required this.partnerCount,
    required this.sharedCount,
  });

  factory PartnerAchievements.fromJson(Map<String, dynamic> json) =>
      _$PartnerAchievementsFromJson(json);
  Map<String, dynamic> toJson() => _$PartnerAchievementsToJson(this);
}

/// Minimal achievement entry for partner comparison
@JsonSerializable()
class PartnerAchievementEntry {
  final String badgeId;
  final DateTime unlockedAt;

  const PartnerAchievementEntry({
    required this.badgeId,
    required this.unlockedAt,
  });

  factory PartnerAchievementEntry.fromJson(Map<String, dynamic> json) =>
      _$PartnerAchievementEntryFromJson(json);
  Map<String, dynamic> toJson() => _$PartnerAchievementEntryToJson(this);
}

/// Streak data model
@JsonSerializable()
class StreakData {
  final int currentStreak;
  final int longestStreak;
  final int goalStreak;
  final int longestGoalStreak;
  final DateTime? lastLogDate;
  final int streakFreezes;
  final int weeklyStreak;
  final int longestWeeklyStreak;
  final int currentWeekDays;
  final List<DateTime> restDayDates;
  final int restDaysRemaining;
  final int partnerShields;

  const StreakData({
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.goalStreak = 0,
    this.longestGoalStreak = 0,
    this.lastLogDate,
    this.streakFreezes = 0,
    this.weeklyStreak = 0,
    this.longestWeeklyStreak = 0,
    this.currentWeekDays = 0,
    this.restDayDates = const [],
    this.restDaysRemaining = 6,
    this.partnerShields = 2,
  });

  factory StreakData.fromJson(Map<String, dynamic> json) =>
      _$StreakDataFromJson(json);
  Map<String, dynamic> toJson() => _$StreakDataToJson(this);

  /// Get flame size based on current streak
  String get flameSize {
    if (currentStreak == 0) return 'none';
    if (currentStreak < 7) return 'small';
    if (currentStreak < 30) return 'medium';
    if (currentStreak < 90) return 'large';
    return 'epic';
  }

  /// Get next milestone
  int? get nextMilestone {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    for (final m in milestones) {
      if (m > currentStreak) return m;
    }
    return null;
  }

  /// Progress to next milestone (0-100)
  double get milestoneProgress {
    final next = nextMilestone;
    if (next == null) return 100;

    const milestones = [0, 7, 14, 30, 60, 90, 180, 365];
    int previous = 0;
    for (final m in milestones) {
      if (m >= next) break;
      if (m <= currentStreak) previous = m;
    }

    final range = next - previous;
    final progress = currentStreak - previous;
    return (progress / range) * 100;
  }

  /// Weekly progress (0-100)
  double get weeklyProgress => (currentWeekDays / 5) * 100;
}

/// Partner shield eligibility check
@JsonSerializable()
class ShieldEligibility {
  final bool canUseShield;
  final String? reason;
  final DateTime? targetDate;

  const ShieldEligibility({
    required this.canUseShield,
    this.reason,
    this.targetDate,
  });

  factory ShieldEligibility.fromJson(Map<String, dynamic> json) =>
      _$ShieldEligibilityFromJson(json);
  Map<String, dynamic> toJson() => _$ShieldEligibilityToJson(this);
}

/// Partner shield status response
@JsonSerializable()
class PartnerShieldStatus {
  final int userShields;
  final int partnerShields;
  final String? partnerName;
  final ShieldEligibility userCanShield;
  final ShieldEligibility partnerCanShield;

  const PartnerShieldStatus({
    required this.userShields,
    required this.partnerShields,
    this.partnerName,
    required this.userCanShield,
    required this.partnerCanShield,
  });

  factory PartnerShieldStatus.fromJson(Map<String, dynamic> json) =>
      _$PartnerShieldStatusFromJson(json);
  Map<String, dynamic> toJson() => _$PartnerShieldStatusToJson(this);
}

/// Single shield history entry
@JsonSerializable()
class ShieldHistoryEntry {
  final DateTime date;
  final DateTime createdAt;
  final String partnerName;

  const ShieldHistoryEntry({
    required this.date,
    required this.createdAt,
    required this.partnerName,
  });

  factory ShieldHistoryEntry.fromJson(Map<String, dynamic> json) =>
      _$ShieldHistoryEntryFromJson(json);
  Map<String, dynamic> toJson() => _$ShieldHistoryEntryToJson(this);
}

/// Partner shield history response
@JsonSerializable()
class PartnerShieldHistory {
  final List<ShieldHistoryEntry> shieldsGiven;
  final List<ShieldHistoryEntry> shieldsReceived;

  const PartnerShieldHistory({
    this.shieldsGiven = const [],
    this.shieldsReceived = const [],
  });

  factory PartnerShieldHistory.fromJson(Map<String, dynamic> json) =>
      _$PartnerShieldHistoryFromJson(json);
  Map<String, dynamic> toJson() => _$PartnerShieldHistoryToJson(this);
}
