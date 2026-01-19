import 'package:json_annotation/json_annotation.dart';
import 'enums.dart';

part 'food_product.g.dart';

/// Food product from search results (normalized from various data sources)
@JsonSerializable()
class FoodProduct {
  final String id;
  final String name;
  final String? brand;
  final String? imageUrl;
  final String? barcode;
  final FoodDataSource dataSource;
  final String? fatSecretId;

  // Per 100g nutritional data
  final double caloriesPer100g;
  final double proteinPer100g;
  final double carbsPer100g;
  final double fatPer100g;
  final double fiberPer100g;
  final double sugarPer100g;
  final double sodiumPer100g;

  // Serving info
  final double servingSize;
  final String servingUnit;
  final String servingSizeText;

  // Metadata
  final bool hasCompleteNutrition;
  final int qualityScore;

  const FoodProduct({
    required this.id,
    required this.name,
    this.brand,
    this.imageUrl,
    this.barcode,
    required this.dataSource,
    this.fatSecretId,
    required this.caloriesPer100g,
    required this.proteinPer100g,
    required this.carbsPer100g,
    required this.fatPer100g,
    this.fiberPer100g = 0,
    this.sugarPer100g = 0,
    this.sodiumPer100g = 0,
    this.servingSize = 100,
    this.servingUnit = 'g',
    this.servingSizeText = '100g',
    this.hasCompleteNutrition = false,
    this.qualityScore = 0,
  });

  factory FoodProduct.fromJson(Map<String, dynamic> json) =>
      _$FoodProductFromJson(json);
  Map<String, dynamic> toJson() => _$FoodProductToJson(this);

  /// Display name with brand if available
  String get displayName => brand != null && brand!.isNotEmpty
      ? '$name ($brand)'
      : name;

  /// Calculate calories for a given serving size
  double caloriesForServing(double grams) => (caloriesPer100g * grams) / 100;

  /// Calculate protein for a given serving size
  double proteinForServing(double grams) => (proteinPer100g * grams) / 100;

  /// Calculate carbs for a given serving size
  double carbsForServing(double grams) => (carbsPer100g * grams) / 100;

  /// Calculate fat for a given serving size
  double fatForServing(double grams) => (fatPer100g * grams) / 100;

  /// Calculate fiber for a given serving size
  double fiberForServing(double grams) => (fiberPer100g * grams) / 100;
}

/// Search results container
@JsonSerializable()
class FoodSearchResults {
  final List<FoodProduct> products;
  final int totalCount;
  final String query;

  const FoodSearchResults({
    required this.products,
    required this.totalCount,
    required this.query,
  });

  factory FoodSearchResults.fromJson(Map<String, dynamic> json) =>
      _$FoodSearchResultsFromJson(json);
  Map<String, dynamic> toJson() => _$FoodSearchResultsToJson(this);

  factory FoodSearchResults.empty(String query) {
    return FoodSearchResults(
      products: const [],
      totalCount: 0,
      query: query,
    );
  }

  bool get isEmpty => products.isEmpty;
  bool get isNotEmpty => products.isNotEmpty;
}
