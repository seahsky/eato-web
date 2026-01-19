import 'package:json_annotation/json_annotation.dart';

part 'nudge.g.dart';

/// Result of sending a nudge to partner
@JsonSerializable()
class NudgeResult {
  final bool success;
  final bool delivered;
  final String? partnerName;

  const NudgeResult({
    required this.success,
    required this.delivered,
    this.partnerName,
  });

  factory NudgeResult.fromJson(Map<String, dynamic> json) =>
      _$NudgeResultFromJson(json);
  Map<String, dynamic> toJson() => _$NudgeResultToJson(this);
}

/// Status of the last nudge sent (for cooldown display)
@JsonSerializable()
class NudgeStatus {
  final DateTime sentAt;
  final bool canSendNudge;
  final int cooldownRemainingMs;

  const NudgeStatus({
    required this.sentAt,
    required this.canSendNudge,
    required this.cooldownRemainingMs,
  });

  factory NudgeStatus.fromJson(Map<String, dynamic> json) =>
      _$NudgeStatusFromJson(json);
  Map<String, dynamic> toJson() => _$NudgeStatusToJson(this);

  /// Cooldown remaining in a human-readable format
  String get cooldownDisplay {
    if (canSendNudge) return '';
    final hours = cooldownRemainingMs ~/ (1000 * 60 * 60);
    final minutes = (cooldownRemainingMs % (1000 * 60 * 60)) ~/ (1000 * 60);
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }
}

/// Notification settings for the user
@JsonSerializable()
class NotificationSettings {
  final bool partnerFoodLogged;
  final bool partnerGoalReached;
  final bool partnerLinked;
  final bool receiveNudges;
  final String? breakfastReminderTime;
  final String? lunchReminderTime;
  final String? dinnerReminderTime;
  final String timezone;

  const NotificationSettings({
    this.partnerFoodLogged = true,
    this.partnerGoalReached = true,
    this.partnerLinked = true,
    this.receiveNudges = true,
    this.breakfastReminderTime,
    this.lunchReminderTime,
    this.dinnerReminderTime,
    this.timezone = 'UTC',
  });

  factory NotificationSettings.fromJson(Map<String, dynamic> json) =>
      _$NotificationSettingsFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationSettingsToJson(this);

  NotificationSettings copyWith({
    bool? partnerFoodLogged,
    bool? partnerGoalReached,
    bool? partnerLinked,
    bool? receiveNudges,
    String? breakfastReminderTime,
    String? lunchReminderTime,
    String? dinnerReminderTime,
    String? timezone,
  }) {
    return NotificationSettings(
      partnerFoodLogged: partnerFoodLogged ?? this.partnerFoodLogged,
      partnerGoalReached: partnerGoalReached ?? this.partnerGoalReached,
      partnerLinked: partnerLinked ?? this.partnerLinked,
      receiveNudges: receiveNudges ?? this.receiveNudges,
      breakfastReminderTime: breakfastReminderTime ?? this.breakfastReminderTime,
      lunchReminderTime: lunchReminderTime ?? this.lunchReminderTime,
      dinnerReminderTime: dinnerReminderTime ?? this.dinnerReminderTime,
      timezone: timezone ?? this.timezone,
    );
  }
}
