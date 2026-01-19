import 'package:json_annotation/json_annotation.dart';
import 'daily_summary.dart';

part 'partner.g.dart';

/// Partner information for the current user
@JsonSerializable()
class Partner {
  final String id;
  final String? name;
  final String email;
  final String? avatarUrl;

  const Partner({
    required this.id,
    this.name,
    required this.email,
    this.avatarUrl,
  });

  factory Partner.fromJson(Map<String, dynamic> json) =>
      _$PartnerFromJson(json);
  Map<String, dynamic> toJson() => _$PartnerToJson(this);

  /// Display name (falls back to email if no name)
  String get displayName => name ?? email.split('@').first;
}

/// Partner link code for connecting partners
@JsonSerializable()
class PartnerLinkCode {
  final String code;
  final DateTime expiresAt;

  const PartnerLinkCode({
    required this.code,
    required this.expiresAt,
  });

  factory PartnerLinkCode.fromJson(Map<String, dynamic> json) =>
      _$PartnerLinkCodeFromJson(json);
  Map<String, dynamic> toJson() => _$PartnerLinkCodeToJson(this);

  /// Whether the code is still valid
  bool get isValid => DateTime.now().isBefore(expiresAt);

  /// Time remaining until expiry
  Duration get timeRemaining => expiresAt.difference(DateTime.now());
}

/// Partner state for the provider
@JsonSerializable()
class PartnerState {
  final Partner? partner;
  final PartnerLinkCode? linkCode;
  final DailySummary? partnerDailySummary;
  final bool isLoading;
  final String? error;

  const PartnerState({
    this.partner,
    this.linkCode,
    this.partnerDailySummary,
    this.isLoading = false,
    this.error,
  });

  factory PartnerState.fromJson(Map<String, dynamic> json) =>
      _$PartnerStateFromJson(json);
  Map<String, dynamic> toJson() => _$PartnerStateToJson(this);

  bool get hasPartner => partner != null;

  PartnerState copyWith({
    Partner? partner,
    PartnerLinkCode? linkCode,
    DailySummary? partnerDailySummary,
    bool? isLoading,
    String? error,
  }) {
    return PartnerState(
      partner: partner ?? this.partner,
      linkCode: linkCode ?? this.linkCode,
      partnerDailySummary: partnerDailySummary ?? this.partnerDailySummary,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  factory PartnerState.initial() => const PartnerState();
}
