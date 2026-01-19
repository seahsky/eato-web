import 'package:json_annotation/json_annotation.dart';
import 'enums.dart';

part 'approval.g.dart';

/// A food entry pending approval from the current user
@JsonSerializable()
class PendingApproval {
  final String id;
  final String name;
  final String? barcode;
  final String? brand;
  final String? imageUrl;
  final double calories;
  final double? protein;
  final double? carbs;
  final double? fat;
  final double? fiber;
  final double servingSize;
  final String servingUnit;
  final MealType mealType;
  final DateTime consumedAt;
  final DateTime loggedAt;
  final String? loggedByUserId;
  final String? loggedByName;

  const PendingApproval({
    required this.id,
    required this.name,
    this.barcode,
    this.brand,
    this.imageUrl,
    required this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.fiber,
    required this.servingSize,
    required this.servingUnit,
    required this.mealType,
    required this.consumedAt,
    required this.loggedAt,
    this.loggedByUserId,
    this.loggedByName,
  });

  factory PendingApproval.fromJson(Map<String, dynamic> json) =>
      _$PendingApprovalFromJson(json);
  Map<String, dynamic> toJson() => _$PendingApprovalToJson(this);

  /// Display name with brand if available
  String get displayName => brand != null ? '$name ($brand)' : name;
}

/// A food entry that the current user submitted for their partner
@JsonSerializable()
class MySubmission {
  final String id;
  final String name;
  final String? barcode;
  final String? brand;
  final String? imageUrl;
  final double calories;
  final double? protein;
  final double? carbs;
  final double? fat;
  final double? fiber;
  final double servingSize;
  final String servingUnit;
  final MealType mealType;
  final DateTime consumedAt;
  final DateTime loggedAt;
  final ApprovalStatus approvalStatus;
  final String? rejectionNote;
  final SubmissionUser? user;

  const MySubmission({
    required this.id,
    required this.name,
    this.barcode,
    this.brand,
    this.imageUrl,
    required this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.fiber,
    required this.servingSize,
    required this.servingUnit,
    required this.mealType,
    required this.consumedAt,
    required this.loggedAt,
    required this.approvalStatus,
    this.rejectionNote,
    this.user,
  });

  factory MySubmission.fromJson(Map<String, dynamic> json) =>
      _$MySubmissionFromJson(json);
  Map<String, dynamic> toJson() => _$MySubmissionToJson(this);

  /// Display name with brand if available
  String get displayName => brand != null ? '$name ($brand)' : name;

  /// Partner's name (the person this was submitted for)
  String? get partnerName => user?.name;
}

/// Nested user object in MySubmission
@JsonSerializable()
class SubmissionUser {
  final String? name;

  const SubmissionUser({this.name});

  factory SubmissionUser.fromJson(Map<String, dynamic> json) =>
      _$SubmissionUserFromJson(json);
  Map<String, dynamic> toJson() => _$SubmissionUserToJson(this);
}
