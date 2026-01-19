// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Profile _$ProfileFromJson(Map<String, dynamic> json) => Profile(
      id: json['id'] as String,
      userId: json['userId'] as String,
      age: (json['age'] as num).toInt(),
      weight: (json['weight'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
      gender: $enumDecode(_$GenderEnumMap, json['gender']),
      activityLevel: $enumDecode(_$ActivityLevelEnumMap, json['activityLevel']),
      bmr: (json['bmr'] as num).toDouble(),
      tdee: (json['tdee'] as num).toDouble(),
      calorieGoal: (json['calorieGoal'] as num).toDouble(),
      weeklyCalorieBudget: (json['weeklyCalorieBudget'] as num?)?.toDouble(),
      weekStartDay: (json['weekStartDay'] as num?)?.toInt() ?? 0,
      displayMode:
          $enumDecodeNullable(_$DisplayModeEnumMap, json['displayMode']) ??
              DisplayMode.QUALITATIVE,
      energyUnit:
          $enumDecodeNullable(_$EnergyUnitEnumMap, json['energyUnit']) ??
              EnergyUnit.KCAL,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$ProfileToJson(Profile instance) => <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'age': instance.age,
      'weight': instance.weight,
      'height': instance.height,
      'gender': _$GenderEnumMap[instance.gender]!,
      'activityLevel': _$ActivityLevelEnumMap[instance.activityLevel]!,
      'bmr': instance.bmr,
      'tdee': instance.tdee,
      'calorieGoal': instance.calorieGoal,
      'weeklyCalorieBudget': instance.weeklyCalorieBudget,
      'weekStartDay': instance.weekStartDay,
      'displayMode': _$DisplayModeEnumMap[instance.displayMode]!,
      'energyUnit': _$EnergyUnitEnumMap[instance.energyUnit]!,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

const _$GenderEnumMap = {
  Gender.MALE: 'MALE',
  Gender.FEMALE: 'FEMALE',
};

const _$ActivityLevelEnumMap = {
  ActivityLevel.SEDENTARY: 'SEDENTARY',
  ActivityLevel.LIGHTLY_ACTIVE: 'LIGHTLY_ACTIVE',
  ActivityLevel.MODERATELY_ACTIVE: 'MODERATELY_ACTIVE',
  ActivityLevel.ACTIVE: 'ACTIVE',
  ActivityLevel.VERY_ACTIVE: 'VERY_ACTIVE',
};

const _$DisplayModeEnumMap = {
  DisplayMode.QUALITATIVE: 'QUALITATIVE',
  DisplayMode.EXACT: 'EXACT',
};

const _$EnergyUnitEnumMap = {
  EnergyUnit.KCAL: 'KCAL',
  EnergyUnit.KJ: 'KJ',
};

ProfileInput _$ProfileInputFromJson(Map<String, dynamic> json) => ProfileInput(
      age: (json['age'] as num).toInt(),
      weight: (json['weight'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
      gender: $enumDecode(_$GenderEnumMap, json['gender']),
      activityLevel: $enumDecode(_$ActivityLevelEnumMap, json['activityLevel']),
      calorieGoal: (json['calorieGoal'] as num?)?.toDouble(),
      energyUnit: $enumDecodeNullable(_$EnergyUnitEnumMap, json['energyUnit']),
    );

Map<String, dynamic> _$ProfileInputToJson(ProfileInput instance) =>
    <String, dynamic>{
      'age': instance.age,
      'weight': instance.weight,
      'height': instance.height,
      'gender': _$GenderEnumMap[instance.gender]!,
      'activityLevel': _$ActivityLevelEnumMap[instance.activityLevel]!,
      'calorieGoal': instance.calorieGoal,
      'energyUnit': _$EnergyUnitEnumMap[instance.energyUnit],
    };

BmrTdeePreview _$BmrTdeePreviewFromJson(Map<String, dynamic> json) =>
    BmrTdeePreview(
      bmr: (json['bmr'] as num).toDouble(),
      tdee: (json['tdee'] as num).toDouble(),
      suggestedGoal: (json['suggestedGoal'] as num).toDouble(),
    );

Map<String, dynamic> _$BmrTdeePreviewToJson(BmrTdeePreview instance) =>
    <String, dynamic>{
      'bmr': instance.bmr,
      'tdee': instance.tdee,
      'suggestedGoal': instance.suggestedGoal,
    };
