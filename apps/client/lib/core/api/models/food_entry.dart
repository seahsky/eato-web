import 'package:json_annotation/json_annotation.dart';
import 'enums.dart';

part 'food_entry.g.dart';

@JsonSerializable()
class FoodEntry {
  final String id;
  final String userId;
  final String name;
  final String? barcode;
  final String? brand;
  final String? imageUrl;
  final double calories;
  final double? protein;
  final double? carbs;
  final double? fat;
  final double? fiber;
  final double? sugar;
  final double? sodium;
  final double servingSize;
  final String servingUnit;
  final MealType mealType;
  final DateTime loggedAt;
  final DateTime consumedAt;
  final String? dailyLogId;
  final bool isManualEntry;
  final FoodDataSource dataSource;
  final String? fatSecretId;
  final String? recipeId;

  const FoodEntry({
    required this.id,
    required this.userId,
    required this.name,
    this.barcode,
    this.brand,
    this.imageUrl,
    required this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.fiber,
    this.sugar,
    this.sodium,
    required this.servingSize,
    required this.servingUnit,
    required this.mealType,
    required this.loggedAt,
    required this.consumedAt,
    this.dailyLogId,
    this.isManualEntry = false,
    this.dataSource = FoodDataSource.MANUAL,
    this.fatSecretId,
    this.recipeId,
  });

  factory FoodEntry.fromJson(Map<String, dynamic> json) =>
      _$FoodEntryFromJson(json);
  Map<String, dynamic> toJson() => _$FoodEntryToJson(this);

  FoodEntry copyWith({
    String? id,
    String? userId,
    String? name,
    String? barcode,
    String? brand,
    String? imageUrl,
    double? calories,
    double? protein,
    double? carbs,
    double? fat,
    double? fiber,
    double? sugar,
    double? sodium,
    double? servingSize,
    String? servingUnit,
    MealType? mealType,
    DateTime? loggedAt,
    DateTime? consumedAt,
    String? dailyLogId,
    bool? isManualEntry,
    FoodDataSource? dataSource,
    String? fatSecretId,
    String? recipeId,
  }) {
    return FoodEntry(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      barcode: barcode ?? this.barcode,
      brand: brand ?? this.brand,
      imageUrl: imageUrl ?? this.imageUrl,
      calories: calories ?? this.calories,
      protein: protein ?? this.protein,
      carbs: carbs ?? this.carbs,
      fat: fat ?? this.fat,
      fiber: fiber ?? this.fiber,
      sugar: sugar ?? this.sugar,
      sodium: sodium ?? this.sodium,
      servingSize: servingSize ?? this.servingSize,
      servingUnit: servingUnit ?? this.servingUnit,
      mealType: mealType ?? this.mealType,
      loggedAt: loggedAt ?? this.loggedAt,
      consumedAt: consumedAt ?? this.consumedAt,
      dailyLogId: dailyLogId ?? this.dailyLogId,
      isManualEntry: isManualEntry ?? this.isManualEntry,
      dataSource: dataSource ?? this.dataSource,
      fatSecretId: fatSecretId ?? this.fatSecretId,
      recipeId: recipeId ?? this.recipeId,
    );
  }

  /// Display name with brand if available
  String get displayName => brand != null ? '$name ($brand)' : name;
}

/// Input data for creating a food entry
@JsonSerializable()
class FoodEntryInput {
  final String name;
  final String? barcode;
  final String? brand;
  final String? imageUrl;
  final double calories;
  final double? protein;
  final double? carbs;
  final double? fat;
  final double? fiber;
  final double? sugar;
  final double? sodium;
  final double servingSize;
  final String servingUnit;
  final MealType mealType;
  final DateTime consumedAt;
  final bool isManualEntry;
  final FoodDataSource dataSource;
  final String? fatSecretId;

  const FoodEntryInput({
    required this.name,
    this.barcode,
    this.brand,
    this.imageUrl,
    required this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.fiber,
    this.sugar,
    this.sodium,
    required this.servingSize,
    required this.servingUnit,
    required this.mealType,
    required this.consumedAt,
    this.isManualEntry = true,
    this.dataSource = FoodDataSource.MANUAL,
    this.fatSecretId,
  });

  factory FoodEntryInput.fromJson(Map<String, dynamic> json) =>
      _$FoodEntryInputFromJson(json);
  Map<String, dynamic> toJson() => _$FoodEntryInputToJson(this);
}
