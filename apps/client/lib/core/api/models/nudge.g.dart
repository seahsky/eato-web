// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'nudge.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NudgeResult _$NudgeResultFromJson(Map<String, dynamic> json) => NudgeResult(
      success: json['success'] as bool,
      delivered: json['delivered'] as bool,
      partnerName: json['partnerName'] as String?,
    );

Map<String, dynamic> _$NudgeResultToJson(NudgeResult instance) =>
    <String, dynamic>{
      'success': instance.success,
      'delivered': instance.delivered,
      'partnerName': instance.partnerName,
    };

NudgeStatus _$NudgeStatusFromJson(Map<String, dynamic> json) => NudgeStatus(
      sentAt: DateTime.parse(json['sentAt'] as String),
      canSendNudge: json['canSendNudge'] as bool,
      cooldownRemainingMs: (json['cooldownRemainingMs'] as num).toInt(),
    );

Map<String, dynamic> _$NudgeStatusToJson(NudgeStatus instance) =>
    <String, dynamic>{
      'sentAt': instance.sentAt.toIso8601String(),
      'canSendNudge': instance.canSendNudge,
      'cooldownRemainingMs': instance.cooldownRemainingMs,
    };

NotificationSettings _$NotificationSettingsFromJson(
        Map<String, dynamic> json) =>
    NotificationSettings(
      partnerFoodLogged: json['partnerFoodLogged'] as bool? ?? true,
      partnerGoalReached: json['partnerGoalReached'] as bool? ?? true,
      partnerLinked: json['partnerLinked'] as bool? ?? true,
      receiveNudges: json['receiveNudges'] as bool? ?? true,
      breakfastReminderTime: json['breakfastReminderTime'] as String?,
      lunchReminderTime: json['lunchReminderTime'] as String?,
      dinnerReminderTime: json['dinnerReminderTime'] as String?,
      timezone: json['timezone'] as String? ?? 'UTC',
    );

Map<String, dynamic> _$NotificationSettingsToJson(
        NotificationSettings instance) =>
    <String, dynamic>{
      'partnerFoodLogged': instance.partnerFoodLogged,
      'partnerGoalReached': instance.partnerGoalReached,
      'partnerLinked': instance.partnerLinked,
      'receiveNudges': instance.receiveNudges,
      'breakfastReminderTime': instance.breakfastReminderTime,
      'lunchReminderTime': instance.lunchReminderTime,
      'dinnerReminderTime': instance.dinnerReminderTime,
      'timezone': instance.timezone,
    };
