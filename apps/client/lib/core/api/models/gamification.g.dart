// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'gamification.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Badge _$BadgeFromJson(Map<String, dynamic> json) => Badge(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      category: $enumDecode(_$BadgeCategoryEnumMap, json['category']),
      icon: json['icon'] as String,
      requirement: json['requirement'] as String,
      rarity: $enumDecode(_$BadgeRarityEnumMap, json['rarity']),
      order: (json['order'] as num).toInt(),
      unlocked: json['unlocked'] as bool?,
      unlockedAt: json['unlockedAt'] == null
          ? null
          : DateTime.parse(json['unlockedAt'] as String),
    );

Map<String, dynamic> _$BadgeToJson(Badge instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'category': _$BadgeCategoryEnumMap[instance.category]!,
      'icon': instance.icon,
      'requirement': instance.requirement,
      'rarity': _$BadgeRarityEnumMap[instance.rarity]!,
      'order': instance.order,
      'unlocked': instance.unlocked,
      'unlockedAt': instance.unlockedAt?.toIso8601String(),
    };

const _$BadgeCategoryEnumMap = {
  BadgeCategory.consistency: 'consistency',
  BadgeCategory.logging: 'logging',
  BadgeCategory.goals: 'goals',
  BadgeCategory.partner: 'partner',
};

const _$BadgeRarityEnumMap = {
  BadgeRarity.common: 'common',
  BadgeRarity.uncommon: 'uncommon',
  BadgeRarity.rare: 'rare',
  BadgeRarity.epic: 'epic',
  BadgeRarity.legendary: 'legendary',
};

AchievementsResponse _$AchievementsResponseFromJson(
        Map<String, dynamic> json) =>
    AchievementsResponse(
      unlockedBadges: (json['unlockedBadges'] as List<dynamic>?)
              ?.map((e) => Badge.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      allBadges: (json['allBadges'] as List<dynamic>?)
              ?.map((e) => Badge.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      totalBadges: (json['totalBadges'] as num).toInt(),
      unlockedCount: (json['unlockedCount'] as num).toInt(),
      avatarFrame: $enumDecode(_$AvatarFrameEnumMap, json['avatarFrame']),
      currentAvatarFrame:
          $enumDecode(_$AvatarFrameEnumMap, json['currentAvatarFrame']),
      unlockedThemes: (json['unlockedThemes'] as List<dynamic>?)
              ?.map((e) => $enumDecode(_$ThemeIdEnumMap, e))
              .toList() ??
          const [],
      currentTheme: $enumDecode(_$ThemeIdEnumMap, json['currentTheme']),
    );

Map<String, dynamic> _$AchievementsResponseToJson(
        AchievementsResponse instance) =>
    <String, dynamic>{
      'unlockedBadges': instance.unlockedBadges,
      'allBadges': instance.allBadges,
      'totalBadges': instance.totalBadges,
      'unlockedCount': instance.unlockedCount,
      'avatarFrame': _$AvatarFrameEnumMap[instance.avatarFrame]!,
      'currentAvatarFrame': _$AvatarFrameEnumMap[instance.currentAvatarFrame]!,
      'unlockedThemes':
          instance.unlockedThemes.map((e) => _$ThemeIdEnumMap[e]!).toList(),
      'currentTheme': _$ThemeIdEnumMap[instance.currentTheme]!,
    };

const _$AvatarFrameEnumMap = {
  AvatarFrame.none: 'none',
  AvatarFrame.bronze: 'bronze',
  AvatarFrame.silver: 'silver',
  AvatarFrame.gold: 'gold',
  AvatarFrame.diamond: 'diamond',
};

const _$ThemeIdEnumMap = {
  ThemeId.defaultTheme: 'default',
  ThemeId.midnight: 'midnight',
  ThemeId.ocean: 'ocean',
  ThemeId.forest: 'forest',
  ThemeId.sunset: 'sunset',
};

BadgesByCategory _$BadgesByCategoryFromJson(Map<String, dynamic> json) =>
    BadgesByCategory(
      consistency: (json['consistency'] as List<dynamic>?)
              ?.map((e) => Badge.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      logging: (json['logging'] as List<dynamic>?)
              ?.map((e) => Badge.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      goals: (json['goals'] as List<dynamic>?)
              ?.map((e) => Badge.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      partner: (json['partner'] as List<dynamic>?)
              ?.map((e) => Badge.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$BadgesByCategoryToJson(BadgesByCategory instance) =>
    <String, dynamic>{
      'consistency': instance.consistency,
      'logging': instance.logging,
      'goals': instance.goals,
      'partner': instance.partner,
    };

AchievementSummary _$AchievementSummaryFromJson(Map<String, dynamic> json) =>
    AchievementSummary(
      badgeCount: (json['badgeCount'] as num).toInt(),
      totalBadges: (json['totalBadges'] as num).toInt(),
      avatarFrame: $enumDecode(_$AvatarFrameEnumMap, json['avatarFrame']),
      currentAvatarFrame:
          $enumDecode(_$AvatarFrameEnumMap, json['currentAvatarFrame']),
      currentStreak: (json['currentStreak'] as num).toInt(),
      longestStreak: (json['longestStreak'] as num).toInt(),
    );

Map<String, dynamic> _$AchievementSummaryToJson(AchievementSummary instance) =>
    <String, dynamic>{
      'badgeCount': instance.badgeCount,
      'totalBadges': instance.totalBadges,
      'avatarFrame': _$AvatarFrameEnumMap[instance.avatarFrame]!,
      'currentAvatarFrame': _$AvatarFrameEnumMap[instance.currentAvatarFrame]!,
      'currentStreak': instance.currentStreak,
      'longestStreak': instance.longestStreak,
    };

PartnerAchievements _$PartnerAchievementsFromJson(Map<String, dynamic> json) =>
    PartnerAchievements(
      partnerName: json['partnerName'] as String,
      userAchievements: (json['userAchievements'] as List<dynamic>?)
              ?.map((e) =>
                  PartnerAchievementEntry.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      partnerAchievements: (json['partnerAchievements'] as List<dynamic>?)
              ?.map((e) =>
                  PartnerAchievementEntry.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      userCount: (json['userCount'] as num).toInt(),
      partnerCount: (json['partnerCount'] as num).toInt(),
      sharedCount: (json['sharedCount'] as num).toInt(),
    );

Map<String, dynamic> _$PartnerAchievementsToJson(
        PartnerAchievements instance) =>
    <String, dynamic>{
      'partnerName': instance.partnerName,
      'userAchievements': instance.userAchievements,
      'partnerAchievements': instance.partnerAchievements,
      'userCount': instance.userCount,
      'partnerCount': instance.partnerCount,
      'sharedCount': instance.sharedCount,
    };

PartnerAchievementEntry _$PartnerAchievementEntryFromJson(
        Map<String, dynamic> json) =>
    PartnerAchievementEntry(
      badgeId: json['badgeId'] as String,
      unlockedAt: DateTime.parse(json['unlockedAt'] as String),
    );

Map<String, dynamic> _$PartnerAchievementEntryToJson(
        PartnerAchievementEntry instance) =>
    <String, dynamic>{
      'badgeId': instance.badgeId,
      'unlockedAt': instance.unlockedAt.toIso8601String(),
    };

StreakData _$StreakDataFromJson(Map<String, dynamic> json) => StreakData(
      currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
      longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
      goalStreak: (json['goalStreak'] as num?)?.toInt() ?? 0,
      longestGoalStreak: (json['longestGoalStreak'] as num?)?.toInt() ?? 0,
      lastLogDate: json['lastLogDate'] == null
          ? null
          : DateTime.parse(json['lastLogDate'] as String),
      streakFreezes: (json['streakFreezes'] as num?)?.toInt() ?? 0,
      weeklyStreak: (json['weeklyStreak'] as num?)?.toInt() ?? 0,
      longestWeeklyStreak: (json['longestWeeklyStreak'] as num?)?.toInt() ?? 0,
      currentWeekDays: (json['currentWeekDays'] as num?)?.toInt() ?? 0,
      restDayDates: (json['restDayDates'] as List<dynamic>?)
              ?.map((e) => DateTime.parse(e as String))
              .toList() ??
          const [],
      restDaysRemaining: (json['restDaysRemaining'] as num?)?.toInt() ?? 6,
      partnerShields: (json['partnerShields'] as num?)?.toInt() ?? 2,
    );

Map<String, dynamic> _$StreakDataToJson(StreakData instance) =>
    <String, dynamic>{
      'currentStreak': instance.currentStreak,
      'longestStreak': instance.longestStreak,
      'goalStreak': instance.goalStreak,
      'longestGoalStreak': instance.longestGoalStreak,
      'lastLogDate': instance.lastLogDate?.toIso8601String(),
      'streakFreezes': instance.streakFreezes,
      'weeklyStreak': instance.weeklyStreak,
      'longestWeeklyStreak': instance.longestWeeklyStreak,
      'currentWeekDays': instance.currentWeekDays,
      'restDayDates':
          instance.restDayDates.map((e) => e.toIso8601String()).toList(),
      'restDaysRemaining': instance.restDaysRemaining,
      'partnerShields': instance.partnerShields,
    };

ShieldEligibility _$ShieldEligibilityFromJson(Map<String, dynamic> json) =>
    ShieldEligibility(
      canUseShield: json['canUseShield'] as bool,
      reason: json['reason'] as String?,
      targetDate: json['targetDate'] == null
          ? null
          : DateTime.parse(json['targetDate'] as String),
    );

Map<String, dynamic> _$ShieldEligibilityToJson(ShieldEligibility instance) =>
    <String, dynamic>{
      'canUseShield': instance.canUseShield,
      'reason': instance.reason,
      'targetDate': instance.targetDate?.toIso8601String(),
    };

PartnerShieldStatus _$PartnerShieldStatusFromJson(Map<String, dynamic> json) =>
    PartnerShieldStatus(
      userShields: (json['userShields'] as num).toInt(),
      partnerShields: (json['partnerShields'] as num).toInt(),
      partnerName: json['partnerName'] as String?,
      userCanShield: ShieldEligibility.fromJson(
          json['userCanShield'] as Map<String, dynamic>),
      partnerCanShield: ShieldEligibility.fromJson(
          json['partnerCanShield'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$PartnerShieldStatusToJson(
        PartnerShieldStatus instance) =>
    <String, dynamic>{
      'userShields': instance.userShields,
      'partnerShields': instance.partnerShields,
      'partnerName': instance.partnerName,
      'userCanShield': instance.userCanShield,
      'partnerCanShield': instance.partnerCanShield,
    };

ShieldHistoryEntry _$ShieldHistoryEntryFromJson(Map<String, dynamic> json) =>
    ShieldHistoryEntry(
      date: DateTime.parse(json['date'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      partnerName: json['partnerName'] as String,
    );

Map<String, dynamic> _$ShieldHistoryEntryToJson(ShieldHistoryEntry instance) =>
    <String, dynamic>{
      'date': instance.date.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
      'partnerName': instance.partnerName,
    };

PartnerShieldHistory _$PartnerShieldHistoryFromJson(
        Map<String, dynamic> json) =>
    PartnerShieldHistory(
      shieldsGiven: (json['shieldsGiven'] as List<dynamic>?)
              ?.map(
                  (e) => ShieldHistoryEntry.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      shieldsReceived: (json['shieldsReceived'] as List<dynamic>?)
              ?.map(
                  (e) => ShieldHistoryEntry.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$PartnerShieldHistoryToJson(
        PartnerShieldHistory instance) =>
    <String, dynamic>{
      'shieldsGiven': instance.shieldsGiven,
      'shieldsReceived': instance.shieldsReceived,
    };
