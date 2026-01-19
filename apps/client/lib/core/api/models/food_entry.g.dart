// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'food_entry.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FoodEntry _$FoodEntryFromJson(Map<String, dynamic> json) => FoodEntry(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      barcode: json['barcode'] as String?,
      brand: json['brand'] as String?,
      imageUrl: json['imageUrl'] as String?,
      calories: (json['calories'] as num).toDouble(),
      protein: (json['protein'] as num?)?.toDouble(),
      carbs: (json['carbs'] as num?)?.toDouble(),
      fat: (json['fat'] as num?)?.toDouble(),
      fiber: (json['fiber'] as num?)?.toDouble(),
      sugar: (json['sugar'] as num?)?.toDouble(),
      sodium: (json['sodium'] as num?)?.toDouble(),
      servingSize: (json['servingSize'] as num).toDouble(),
      servingUnit: json['servingUnit'] as String,
      mealType: $enumDecode(_$MealTypeEnumMap, json['mealType']),
      loggedAt: DateTime.parse(json['loggedAt'] as String),
      consumedAt: DateTime.parse(json['consumedAt'] as String),
      dailyLogId: json['dailyLogId'] as String?,
      isManualEntry: json['isManualEntry'] as bool? ?? false,
      dataSource:
          $enumDecodeNullable(_$FoodDataSourceEnumMap, json['dataSource']) ??
              FoodDataSource.MANUAL,
      fatSecretId: json['fatSecretId'] as String?,
      recipeId: json['recipeId'] as String?,
    );

Map<String, dynamic> _$FoodEntryToJson(FoodEntry instance) => <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'name': instance.name,
      'barcode': instance.barcode,
      'brand': instance.brand,
      'imageUrl': instance.imageUrl,
      'calories': instance.calories,
      'protein': instance.protein,
      'carbs': instance.carbs,
      'fat': instance.fat,
      'fiber': instance.fiber,
      'sugar': instance.sugar,
      'sodium': instance.sodium,
      'servingSize': instance.servingSize,
      'servingUnit': instance.servingUnit,
      'mealType': _$MealTypeEnumMap[instance.mealType]!,
      'loggedAt': instance.loggedAt.toIso8601String(),
      'consumedAt': instance.consumedAt.toIso8601String(),
      'dailyLogId': instance.dailyLogId,
      'isManualEntry': instance.isManualEntry,
      'dataSource': _$FoodDataSourceEnumMap[instance.dataSource]!,
      'fatSecretId': instance.fatSecretId,
      'recipeId': instance.recipeId,
    };

const _$MealTypeEnumMap = {
  MealType.BREAKFAST: 'BREAKFAST',
  MealType.LUNCH: 'LUNCH',
  MealType.DINNER: 'DINNER',
  MealType.SNACK: 'SNACK',
};

const _$FoodDataSourceEnumMap = {
  FoodDataSource.FATSECRET: 'FATSECRET',
  FoodDataSource.MANUAL: 'MANUAL',
  FoodDataSource.OPEN_FOOD_FACTS: 'OPEN_FOOD_FACTS',
  FoodDataSource.USDA: 'USDA',
};

FoodEntryInput _$FoodEntryInputFromJson(Map<String, dynamic> json) =>
    FoodEntryInput(
      name: json['name'] as String,
      barcode: json['barcode'] as String?,
      brand: json['brand'] as String?,
      imageUrl: json['imageUrl'] as String?,
      calories: (json['calories'] as num).toDouble(),
      protein: (json['protein'] as num?)?.toDouble(),
      carbs: (json['carbs'] as num?)?.toDouble(),
      fat: (json['fat'] as num?)?.toDouble(),
      fiber: (json['fiber'] as num?)?.toDouble(),
      sugar: (json['sugar'] as num?)?.toDouble(),
      sodium: (json['sodium'] as num?)?.toDouble(),
      servingSize: (json['servingSize'] as num).toDouble(),
      servingUnit: json['servingUnit'] as String,
      mealType: $enumDecode(_$MealTypeEnumMap, json['mealType']),
      consumedAt: DateTime.parse(json['consumedAt'] as String),
      isManualEntry: json['isManualEntry'] as bool? ?? true,
      dataSource:
          $enumDecodeNullable(_$FoodDataSourceEnumMap, json['dataSource']) ??
              FoodDataSource.MANUAL,
      fatSecretId: json['fatSecretId'] as String?,
    );

Map<String, dynamic> _$FoodEntryInputToJson(FoodEntryInput instance) =>
    <String, dynamic>{
      'name': instance.name,
      'barcode': instance.barcode,
      'brand': instance.brand,
      'imageUrl': instance.imageUrl,
      'calories': instance.calories,
      'protein': instance.protein,
      'carbs': instance.carbs,
      'fat': instance.fat,
      'fiber': instance.fiber,
      'sugar': instance.sugar,
      'sodium': instance.sodium,
      'servingSize': instance.servingSize,
      'servingUnit': instance.servingUnit,
      'mealType': _$MealTypeEnumMap[instance.mealType]!,
      'consumedAt': instance.consumedAt.toIso8601String(),
      'isManualEntry': instance.isManualEntry,
      'dataSource': _$FoodDataSourceEnumMap[instance.dataSource]!,
      'fatSecretId': instance.fatSecretId,
    };
