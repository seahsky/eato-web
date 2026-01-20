import 'package:json_annotation/json_annotation.dart';

part 'recipe.g.dart';

/// Unit types for recipe ingredients
enum IngredientUnit {
  g,
  kg,
  ml,
  L,
  percent;

  String get displayName {
    switch (this) {
      case IngredientUnit.g:
        return 'g';
      case IngredientUnit.kg:
        return 'kg';
      case IngredientUnit.ml:
        return 'ml';
      case IngredientUnit.L:
        return 'L';
      case IngredientUnit.percent:
        return '%';
    }
  }

  /// Convert API string to enum
  static IngredientUnit fromString(String value) {
    if (value == '%') return IngredientUnit.percent;
    return IngredientUnit.values.firstWhere(
      (e) => e.name == value,
      orElse: () => IngredientUnit.g,
    );
  }
}

/// Recipe ingredient model
@JsonSerializable()
class RecipeIngredient {
  final String id;
  final String name;
  final double quantity;
  @JsonKey(fromJson: _unitFromJson, toJson: _unitToJson)
  final IngredientUnit unit;
  final bool isPercentage;
  final String? baseIngredientId;
  final double caloriesPer100g;
  final double proteinPer100g;
  final double carbsPer100g;
  final double fatPer100g;
  final double fiberPer100g;
  final bool isManualEntry;
  final String? openFoodFactsId;
  final int sortOrder;

  const RecipeIngredient({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unit,
    this.isPercentage = false,
    this.baseIngredientId,
    required this.caloriesPer100g,
    this.proteinPer100g = 0,
    this.carbsPer100g = 0,
    this.fatPer100g = 0,
    this.fiberPer100g = 0,
    this.isManualEntry = false,
    this.openFoodFactsId,
    this.sortOrder = 0,
  });

  factory RecipeIngredient.fromJson(Map<String, dynamic> json) =>
      _$RecipeIngredientFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeIngredientToJson(this);

  RecipeIngredient copyWith({
    String? id,
    String? name,
    double? quantity,
    IngredientUnit? unit,
    bool? isPercentage,
    String? baseIngredientId,
    double? caloriesPer100g,
    double? proteinPer100g,
    double? carbsPer100g,
    double? fatPer100g,
    double? fiberPer100g,
    bool? isManualEntry,
    String? openFoodFactsId,
    int? sortOrder,
  }) {
    return RecipeIngredient(
      id: id ?? this.id,
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      isPercentage: isPercentage ?? this.isPercentage,
      baseIngredientId: baseIngredientId ?? this.baseIngredientId,
      caloriesPer100g: caloriesPer100g ?? this.caloriesPer100g,
      proteinPer100g: proteinPer100g ?? this.proteinPer100g,
      carbsPer100g: carbsPer100g ?? this.carbsPer100g,
      fatPer100g: fatPer100g ?? this.fatPer100g,
      fiberPer100g: fiberPer100g ?? this.fiberPer100g,
      isManualEntry: isManualEntry ?? this.isManualEntry,
      openFoodFactsId: openFoodFactsId ?? this.openFoodFactsId,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  /// Calculate actual weight in grams
  double get weightInGrams {
    switch (unit) {
      case IngredientUnit.g:
        return quantity;
      case IngredientUnit.kg:
        return quantity * 1000;
      case IngredientUnit.ml:
        return quantity; // Assume 1ml = 1g for simplicity
      case IngredientUnit.L:
        return quantity * 1000;
      case IngredientUnit.percent:
        return 0; // Calculated based on base ingredient
    }
  }
}

/// Recipe model
@JsonSerializable()
class Recipe {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final String? imageUrl;
  final double yieldWeight;
  final String yieldUnit;
  final double caloriesPer100g;
  final double proteinPer100g;
  final double carbsPer100g;
  final double fatPer100g;
  final double fiberPer100g;
  final List<RecipeIngredient> ingredients;
  final DateTime createdAt;
  final DateTime updatedAt;
  final RecipeOwner? user;
  final bool? isOwner;

  const Recipe({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    this.imageUrl,
    required this.yieldWeight,
    this.yieldUnit = 'g',
    required this.caloriesPer100g,
    this.proteinPer100g = 0,
    this.carbsPer100g = 0,
    this.fatPer100g = 0,
    this.fiberPer100g = 0,
    this.ingredients = const [],
    required this.createdAt,
    required this.updatedAt,
    this.user,
    this.isOwner,
  });

  factory Recipe.fromJson(Map<String, dynamic> json) => _$RecipeFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeToJson(this);

  Recipe copyWith({
    String? id,
    String? userId,
    String? name,
    String? description,
    String? imageUrl,
    double? yieldWeight,
    String? yieldUnit,
    double? caloriesPer100g,
    double? proteinPer100g,
    double? carbsPer100g,
    double? fatPer100g,
    double? fiberPer100g,
    List<RecipeIngredient>? ingredients,
    DateTime? createdAt,
    DateTime? updatedAt,
    RecipeOwner? user,
    bool? isOwner,
  }) {
    return Recipe(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      yieldWeight: yieldWeight ?? this.yieldWeight,
      yieldUnit: yieldUnit ?? this.yieldUnit,
      caloriesPer100g: caloriesPer100g ?? this.caloriesPer100g,
      proteinPer100g: proteinPer100g ?? this.proteinPer100g,
      carbsPer100g: carbsPer100g ?? this.carbsPer100g,
      fatPer100g: fatPer100g ?? this.fatPer100g,
      fiberPer100g: fiberPer100g ?? this.fiberPer100g,
      ingredients: ingredients ?? this.ingredients,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      user: user ?? this.user,
      isOwner: isOwner ?? this.isOwner,
    );
  }

  /// Calculate nutrition for a given serving size
  double caloriesForServing(double grams) => (caloriesPer100g * grams) / 100;
  double proteinForServing(double grams) => (proteinPer100g * grams) / 100;
  double carbsForServing(double grams) => (carbsPer100g * grams) / 100;
  double fatForServing(double grams) => (fatPer100g * grams) / 100;
  double fiberForServing(double grams) => (fiberPer100g * grams) / 100;

  /// Total calories for the entire recipe
  double get totalCalories => caloriesForServing(yieldWeight);
}

/// Minimal owner info included in recipe responses
@JsonSerializable()
class RecipeOwner {
  final String? id;
  final String? name;

  const RecipeOwner({this.id, this.name});

  factory RecipeOwner.fromJson(Map<String, dynamic> json) =>
      _$RecipeOwnerFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeOwnerToJson(this);
}

/// Response from listing recipes
@JsonSerializable()
class RecipeListResponse {
  final List<Recipe> userRecipes;
  final List<Recipe> partnerRecipes;

  const RecipeListResponse({
    this.userRecipes = const [],
    this.partnerRecipes = const [],
  });

  factory RecipeListResponse.fromJson(Map<String, dynamic> json) =>
      _$RecipeListResponseFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeListResponseToJson(this);
}

/// Input for creating/updating a recipe
@JsonSerializable()
class RecipeInput {
  final String name;
  final String? description;
  final String? imageUrl;
  final double yieldWeight;
  final String yieldUnit;
  final List<RecipeIngredientInput> ingredients;

  const RecipeInput({
    required this.name,
    this.description,
    this.imageUrl,
    required this.yieldWeight,
    this.yieldUnit = 'g',
    required this.ingredients,
  });

  factory RecipeInput.fromJson(Map<String, dynamic> json) =>
      _$RecipeInputFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeInputToJson(this);
}

/// Input for recipe ingredients
@JsonSerializable()
class RecipeIngredientInput {
  final String? id;
  final String name;
  final double quantity;
  @JsonKey(fromJson: _unitFromJson, toJson: _unitToJson)
  final IngredientUnit unit;
  final bool isPercentage;
  final String? baseIngredientId;
  final double caloriesPer100g;
  final double proteinPer100g;
  final double carbsPer100g;
  final double fatPer100g;
  final double fiberPer100g;
  final bool isManualEntry;
  final String? openFoodFactsId;
  final int sortOrder;

  const RecipeIngredientInput({
    this.id,
    required this.name,
    required this.quantity,
    required this.unit,
    this.isPercentage = false,
    this.baseIngredientId,
    required this.caloriesPer100g,
    this.proteinPer100g = 0,
    this.carbsPer100g = 0,
    this.fatPer100g = 0,
    this.fiberPer100g = 0,
    this.isManualEntry = false,
    this.openFoodFactsId,
    this.sortOrder = 0,
  });

  factory RecipeIngredientInput.fromJson(Map<String, dynamic> json) =>
      _$RecipeIngredientInputFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeIngredientInputToJson(this);
}

/// Input for logging a recipe portion
@JsonSerializable()
class RecipeLogInput {
  final String recipeId;
  final double consumedWeight;
  final String mealType;
  final String consumedAt; // YYYY-MM-DD format

  const RecipeLogInput({
    required this.recipeId,
    required this.consumedWeight,
    required this.mealType,
    required this.consumedAt,
  });

  factory RecipeLogInput.fromJson(Map<String, dynamic> json) =>
      _$RecipeLogInputFromJson(json);
  Map<String, dynamic> toJson() => _$RecipeLogInputToJson(this);
}

/// Nutrition preview response
@JsonSerializable()
class NutritionPreview {
  final double caloriesPer100g;
  final double proteinPer100g;
  final double carbsPer100g;
  final double fatPer100g;
  final double fiberPer100g;
  final double totalWeight;

  const NutritionPreview({
    required this.caloriesPer100g,
    required this.proteinPer100g,
    required this.carbsPer100g,
    required this.fatPer100g,
    required this.fiberPer100g,
    required this.totalWeight,
  });

  factory NutritionPreview.fromJson(Map<String, dynamic> json) =>
      _$NutritionPreviewFromJson(json);
  Map<String, dynamic> toJson() => _$NutritionPreviewToJson(this);
}

/// Recent recipe for quick access carousel
@JsonSerializable()
class RecentRecipe {
  final String id;
  final String name;
  final String? imageUrl;
  final double caloriesPer100g;
  final double proteinPer100g;
  final double carbsPer100g;
  final double fatPer100g;
  final double yieldWeight;
  final String yieldUnit;
  final DateTime updatedAt;

  const RecentRecipe({
    required this.id,
    required this.name,
    this.imageUrl,
    required this.caloriesPer100g,
    this.proteinPer100g = 0,
    this.carbsPer100g = 0,
    this.fatPer100g = 0,
    required this.yieldWeight,
    this.yieldUnit = 'g',
    required this.updatedAt,
  });

  factory RecentRecipe.fromJson(Map<String, dynamic> json) =>
      _$RecentRecipeFromJson(json);
  Map<String, dynamic> toJson() => _$RecentRecipeToJson(this);

  double caloriesForServing(double grams) => (caloriesPer100g * grams) / 100;
}

// Helper functions for unit serialization
IngredientUnit _unitFromJson(String value) => IngredientUnit.fromString(value);
String _unitToJson(IngredientUnit unit) =>
    unit == IngredientUnit.percent ? '%' : unit.name;
