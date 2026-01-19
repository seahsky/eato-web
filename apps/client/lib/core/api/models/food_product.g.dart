// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'food_product.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FoodProduct _$FoodProductFromJson(Map<String, dynamic> json) => FoodProduct(
      id: json['id'] as String,
      name: json['name'] as String,
      brand: json['brand'] as String?,
      imageUrl: json['imageUrl'] as String?,
      barcode: json['barcode'] as String?,
      dataSource: $enumDecode(_$FoodDataSourceEnumMap, json['dataSource']),
      fatSecretId: json['fatSecretId'] as String?,
      caloriesPer100g: (json['caloriesPer100g'] as num).toDouble(),
      proteinPer100g: (json['proteinPer100g'] as num).toDouble(),
      carbsPer100g: (json['carbsPer100g'] as num).toDouble(),
      fatPer100g: (json['fatPer100g'] as num).toDouble(),
      fiberPer100g: (json['fiberPer100g'] as num?)?.toDouble() ?? 0,
      sugarPer100g: (json['sugarPer100g'] as num?)?.toDouble() ?? 0,
      sodiumPer100g: (json['sodiumPer100g'] as num?)?.toDouble() ?? 0,
      servingSize: (json['servingSize'] as num?)?.toDouble() ?? 100,
      servingUnit: json['servingUnit'] as String? ?? 'g',
      servingSizeText: json['servingSizeText'] as String? ?? '100g',
      hasCompleteNutrition: json['hasCompleteNutrition'] as bool? ?? false,
      qualityScore: (json['qualityScore'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$FoodProductToJson(FoodProduct instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'brand': instance.brand,
      'imageUrl': instance.imageUrl,
      'barcode': instance.barcode,
      'dataSource': _$FoodDataSourceEnumMap[instance.dataSource]!,
      'fatSecretId': instance.fatSecretId,
      'caloriesPer100g': instance.caloriesPer100g,
      'proteinPer100g': instance.proteinPer100g,
      'carbsPer100g': instance.carbsPer100g,
      'fatPer100g': instance.fatPer100g,
      'fiberPer100g': instance.fiberPer100g,
      'sugarPer100g': instance.sugarPer100g,
      'sodiumPer100g': instance.sodiumPer100g,
      'servingSize': instance.servingSize,
      'servingUnit': instance.servingUnit,
      'servingSizeText': instance.servingSizeText,
      'hasCompleteNutrition': instance.hasCompleteNutrition,
      'qualityScore': instance.qualityScore,
    };

const _$FoodDataSourceEnumMap = {
  FoodDataSource.FATSECRET: 'FATSECRET',
  FoodDataSource.MANUAL: 'MANUAL',
  FoodDataSource.OPEN_FOOD_FACTS: 'OPEN_FOOD_FACTS',
  FoodDataSource.USDA: 'USDA',
};

FoodSearchResults _$FoodSearchResultsFromJson(Map<String, dynamic> json) =>
    FoodSearchResults(
      products: (json['products'] as List<dynamic>)
          .map((e) => FoodProduct.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalCount: (json['totalCount'] as num).toInt(),
      query: json['query'] as String,
    );

Map<String, dynamic> _$FoodSearchResultsToJson(FoodSearchResults instance) =>
    <String, dynamic>{
      'products': instance.products,
      'totalCount': instance.totalCount,
      'query': instance.query,
    };
