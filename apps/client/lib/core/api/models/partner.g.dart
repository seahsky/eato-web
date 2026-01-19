// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'partner.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Partner _$PartnerFromJson(Map<String, dynamic> json) => Partner(
      id: json['id'] as String,
      name: json['name'] as String?,
      email: json['email'] as String,
      avatarUrl: json['avatarUrl'] as String?,
    );

Map<String, dynamic> _$PartnerToJson(Partner instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'avatarUrl': instance.avatarUrl,
    };

PartnerLinkCode _$PartnerLinkCodeFromJson(Map<String, dynamic> json) =>
    PartnerLinkCode(
      code: json['code'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );

Map<String, dynamic> _$PartnerLinkCodeToJson(PartnerLinkCode instance) =>
    <String, dynamic>{
      'code': instance.code,
      'expiresAt': instance.expiresAt.toIso8601String(),
    };

PartnerState _$PartnerStateFromJson(Map<String, dynamic> json) => PartnerState(
      partner: json['partner'] == null
          ? null
          : Partner.fromJson(json['partner'] as Map<String, dynamic>),
      linkCode: json['linkCode'] == null
          ? null
          : PartnerLinkCode.fromJson(json['linkCode'] as Map<String, dynamic>),
      partnerDailySummary: json['partnerDailySummary'] == null
          ? null
          : DailySummary.fromJson(
              json['partnerDailySummary'] as Map<String, dynamic>),
      isLoading: json['isLoading'] as bool? ?? false,
      error: json['error'] as String?,
    );

Map<String, dynamic> _$PartnerStateToJson(PartnerState instance) =>
    <String, dynamic>{
      'partner': instance.partner,
      'linkCode': instance.linkCode,
      'partnerDailySummary': instance.partnerDailySummary,
      'isLoading': instance.isLoading,
      'error': instance.error,
    };
