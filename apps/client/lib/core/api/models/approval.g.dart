// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approval.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PendingApproval _$PendingApprovalFromJson(Map<String, dynamic> json) =>
    PendingApproval(
      id: json['id'] as String,
      name: json['name'] as String,
      barcode: json['barcode'] as String?,
      brand: json['brand'] as String?,
      imageUrl: json['imageUrl'] as String?,
      calories: (json['calories'] as num).toDouble(),
      protein: (json['protein'] as num?)?.toDouble(),
      carbs: (json['carbs'] as num?)?.toDouble(),
      fat: (json['fat'] as num?)?.toDouble(),
      fiber: (json['fiber'] as num?)?.toDouble(),
      servingSize: (json['servingSize'] as num).toDouble(),
      servingUnit: json['servingUnit'] as String,
      mealType: $enumDecode(_$MealTypeEnumMap, json['mealType']),
      consumedAt: DateTime.parse(json['consumedAt'] as String),
      loggedAt: DateTime.parse(json['loggedAt'] as String),
      loggedByUserId: json['loggedByUserId'] as String?,
      loggedByName: json['loggedByName'] as String?,
    );

Map<String, dynamic> _$PendingApprovalToJson(PendingApproval instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'barcode': instance.barcode,
      'brand': instance.brand,
      'imageUrl': instance.imageUrl,
      'calories': instance.calories,
      'protein': instance.protein,
      'carbs': instance.carbs,
      'fat': instance.fat,
      'fiber': instance.fiber,
      'servingSize': instance.servingSize,
      'servingUnit': instance.servingUnit,
      'mealType': _$MealTypeEnumMap[instance.mealType]!,
      'consumedAt': instance.consumedAt.toIso8601String(),
      'loggedAt': instance.loggedAt.toIso8601String(),
      'loggedByUserId': instance.loggedByUserId,
      'loggedByName': instance.loggedByName,
    };

const _$MealTypeEnumMap = {
  MealType.BREAKFAST: 'BREAKFAST',
  MealType.LUNCH: 'LUNCH',
  MealType.DINNER: 'DINNER',
  MealType.SNACK: 'SNACK',
};

MySubmission _$MySubmissionFromJson(Map<String, dynamic> json) => MySubmission(
      id: json['id'] as String,
      name: json['name'] as String,
      barcode: json['barcode'] as String?,
      brand: json['brand'] as String?,
      imageUrl: json['imageUrl'] as String?,
      calories: (json['calories'] as num).toDouble(),
      protein: (json['protein'] as num?)?.toDouble(),
      carbs: (json['carbs'] as num?)?.toDouble(),
      fat: (json['fat'] as num?)?.toDouble(),
      fiber: (json['fiber'] as num?)?.toDouble(),
      servingSize: (json['servingSize'] as num).toDouble(),
      servingUnit: json['servingUnit'] as String,
      mealType: $enumDecode(_$MealTypeEnumMap, json['mealType']),
      consumedAt: DateTime.parse(json['consumedAt'] as String),
      loggedAt: DateTime.parse(json['loggedAt'] as String),
      approvalStatus:
          $enumDecode(_$ApprovalStatusEnumMap, json['approvalStatus']),
      rejectionNote: json['rejectionNote'] as String?,
      user: json['user'] == null
          ? null
          : SubmissionUser.fromJson(json['user'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MySubmissionToJson(MySubmission instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'barcode': instance.barcode,
      'brand': instance.brand,
      'imageUrl': instance.imageUrl,
      'calories': instance.calories,
      'protein': instance.protein,
      'carbs': instance.carbs,
      'fat': instance.fat,
      'fiber': instance.fiber,
      'servingSize': instance.servingSize,
      'servingUnit': instance.servingUnit,
      'mealType': _$MealTypeEnumMap[instance.mealType]!,
      'consumedAt': instance.consumedAt.toIso8601String(),
      'loggedAt': instance.loggedAt.toIso8601String(),
      'approvalStatus': _$ApprovalStatusEnumMap[instance.approvalStatus]!,
      'rejectionNote': instance.rejectionNote,
      'user': instance.user,
    };

const _$ApprovalStatusEnumMap = {
  ApprovalStatus.PENDING: 'PENDING',
  ApprovalStatus.APPROVED: 'APPROVED',
  ApprovalStatus.REJECTED: 'REJECTED',
};

SubmissionUser _$SubmissionUserFromJson(Map<String, dynamic> json) =>
    SubmissionUser(
      name: json['name'] as String?,
    );

Map<String, dynamic> _$SubmissionUserToJson(SubmissionUser instance) =>
    <String, dynamic>{
      'name': instance.name,
    };
