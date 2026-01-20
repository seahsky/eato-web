// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recipe.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RecipeIngredient _$RecipeIngredientFromJson(Map<String, dynamic> json) =>
    RecipeIngredient(
      id: json['id'] as String,
      name: json['name'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      unit: _unitFromJson(json['unit'] as String),
      isPercentage: json['isPercentage'] as bool? ?? false,
      baseIngredientId: json['baseIngredientId'] as String?,
      caloriesPer100g: (json['caloriesPer100g'] as num).toDouble(),
      proteinPer100g: (json['proteinPer100g'] as num?)?.toDouble() ?? 0,
      carbsPer100g: (json['carbsPer100g'] as num?)?.toDouble() ?? 0,
      fatPer100g: (json['fatPer100g'] as num?)?.toDouble() ?? 0,
      fiberPer100g: (json['fiberPer100g'] as num?)?.toDouble() ?? 0,
      isManualEntry: json['isManualEntry'] as bool? ?? false,
      openFoodFactsId: json['openFoodFactsId'] as String?,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$RecipeIngredientToJson(RecipeIngredient instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'quantity': instance.quantity,
      'unit': _unitToJson(instance.unit),
      'isPercentage': instance.isPercentage,
      'baseIngredientId': instance.baseIngredientId,
      'caloriesPer100g': instance.caloriesPer100g,
      'proteinPer100g': instance.proteinPer100g,
      'carbsPer100g': instance.carbsPer100g,
      'fatPer100g': instance.fatPer100g,
      'fiberPer100g': instance.fiberPer100g,
      'isManualEntry': instance.isManualEntry,
      'openFoodFactsId': instance.openFoodFactsId,
      'sortOrder': instance.sortOrder,
    };

Recipe _$RecipeFromJson(Map<String, dynamic> json) => Recipe(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      yieldWeight: (json['yieldWeight'] as num).toDouble(),
      yieldUnit: json['yieldUnit'] as String? ?? 'g',
      caloriesPer100g: (json['caloriesPer100g'] as num).toDouble(),
      proteinPer100g: (json['proteinPer100g'] as num?)?.toDouble() ?? 0,
      carbsPer100g: (json['carbsPer100g'] as num?)?.toDouble() ?? 0,
      fatPer100g: (json['fatPer100g'] as num?)?.toDouble() ?? 0,
      fiberPer100g: (json['fiberPer100g'] as num?)?.toDouble() ?? 0,
      ingredients: (json['ingredients'] as List<dynamic>?)
              ?.map((e) => RecipeIngredient.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      user: json['user'] == null
          ? null
          : RecipeOwner.fromJson(json['user'] as Map<String, dynamic>),
      isOwner: json['isOwner'] as bool?,
    );

Map<String, dynamic> _$RecipeToJson(Recipe instance) => <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'name': instance.name,
      'description': instance.description,
      'imageUrl': instance.imageUrl,
      'yieldWeight': instance.yieldWeight,
      'yieldUnit': instance.yieldUnit,
      'caloriesPer100g': instance.caloriesPer100g,
      'proteinPer100g': instance.proteinPer100g,
      'carbsPer100g': instance.carbsPer100g,
      'fatPer100g': instance.fatPer100g,
      'fiberPer100g': instance.fiberPer100g,
      'ingredients': instance.ingredients,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'user': instance.user,
      'isOwner': instance.isOwner,
    };

RecipeOwner _$RecipeOwnerFromJson(Map<String, dynamic> json) => RecipeOwner(
      id: json['id'] as String?,
      name: json['name'] as String?,
    );

Map<String, dynamic> _$RecipeOwnerToJson(RecipeOwner instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
    };

RecipeListResponse _$RecipeListResponseFromJson(Map<String, dynamic> json) =>
    RecipeListResponse(
      userRecipes: (json['userRecipes'] as List<dynamic>?)
              ?.map((e) => Recipe.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      partnerRecipes: (json['partnerRecipes'] as List<dynamic>?)
              ?.map((e) => Recipe.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$RecipeListResponseToJson(RecipeListResponse instance) =>
    <String, dynamic>{
      'userRecipes': instance.userRecipes,
      'partnerRecipes': instance.partnerRecipes,
    };

RecipeInput _$RecipeInputFromJson(Map<String, dynamic> json) => RecipeInput(
      name: json['name'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      yieldWeight: (json['yieldWeight'] as num).toDouble(),
      yieldUnit: json['yieldUnit'] as String? ?? 'g',
      ingredients: (json['ingredients'] as List<dynamic>)
          .map((e) => RecipeIngredientInput.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$RecipeInputToJson(RecipeInput instance) =>
    <String, dynamic>{
      'name': instance.name,
      'description': instance.description,
      'imageUrl': instance.imageUrl,
      'yieldWeight': instance.yieldWeight,
      'yieldUnit': instance.yieldUnit,
      'ingredients': instance.ingredients,
    };

RecipeIngredientInput _$RecipeIngredientInputFromJson(
        Map<String, dynamic> json) =>
    RecipeIngredientInput(
      id: json['id'] as String?,
      name: json['name'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      unit: _unitFromJson(json['unit'] as String),
      isPercentage: json['isPercentage'] as bool? ?? false,
      baseIngredientId: json['baseIngredientId'] as String?,
      caloriesPer100g: (json['caloriesPer100g'] as num).toDouble(),
      proteinPer100g: (json['proteinPer100g'] as num?)?.toDouble() ?? 0,
      carbsPer100g: (json['carbsPer100g'] as num?)?.toDouble() ?? 0,
      fatPer100g: (json['fatPer100g'] as num?)?.toDouble() ?? 0,
      fiberPer100g: (json['fiberPer100g'] as num?)?.toDouble() ?? 0,
      isManualEntry: json['isManualEntry'] as bool? ?? false,
      openFoodFactsId: json['openFoodFactsId'] as String?,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$RecipeIngredientInputToJson(
        RecipeIngredientInput instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'quantity': instance.quantity,
      'unit': _unitToJson(instance.unit),
      'isPercentage': instance.isPercentage,
      'baseIngredientId': instance.baseIngredientId,
      'caloriesPer100g': instance.caloriesPer100g,
      'proteinPer100g': instance.proteinPer100g,
      'carbsPer100g': instance.carbsPer100g,
      'fatPer100g': instance.fatPer100g,
      'fiberPer100g': instance.fiberPer100g,
      'isManualEntry': instance.isManualEntry,
      'openFoodFactsId': instance.openFoodFactsId,
      'sortOrder': instance.sortOrder,
    };

RecipeLogInput _$RecipeLogInputFromJson(Map<String, dynamic> json) =>
    RecipeLogInput(
      recipeId: json['recipeId'] as String,
      consumedWeight: (json['consumedWeight'] as num).toDouble(),
      mealType: json['mealType'] as String,
      consumedAt: json['consumedAt'] as String,
    );

Map<String, dynamic> _$RecipeLogInputToJson(RecipeLogInput instance) =>
    <String, dynamic>{
      'recipeId': instance.recipeId,
      'consumedWeight': instance.consumedWeight,
      'mealType': instance.mealType,
      'consumedAt': instance.consumedAt,
    };

NutritionPreview _$NutritionPreviewFromJson(Map<String, dynamic> json) =>
    NutritionPreview(
      caloriesPer100g: (json['caloriesPer100g'] as num).toDouble(),
      proteinPer100g: (json['proteinPer100g'] as num).toDouble(),
      carbsPer100g: (json['carbsPer100g'] as num).toDouble(),
      fatPer100g: (json['fatPer100g'] as num).toDouble(),
      fiberPer100g: (json['fiberPer100g'] as num).toDouble(),
      totalWeight: (json['totalWeight'] as num).toDouble(),
    );

Map<String, dynamic> _$NutritionPreviewToJson(NutritionPreview instance) =>
    <String, dynamic>{
      'caloriesPer100g': instance.caloriesPer100g,
      'proteinPer100g': instance.proteinPer100g,
      'carbsPer100g': instance.carbsPer100g,
      'fatPer100g': instance.fatPer100g,
      'fiberPer100g': instance.fiberPer100g,
      'totalWeight': instance.totalWeight,
    };

RecentRecipe _$RecentRecipeFromJson(Map<String, dynamic> json) => RecentRecipe(
      id: json['id'] as String,
      name: json['name'] as String,
      imageUrl: json['imageUrl'] as String?,
      caloriesPer100g: (json['caloriesPer100g'] as num).toDouble(),
      proteinPer100g: (json['proteinPer100g'] as num?)?.toDouble() ?? 0,
      carbsPer100g: (json['carbsPer100g'] as num?)?.toDouble() ?? 0,
      fatPer100g: (json['fatPer100g'] as num?)?.toDouble() ?? 0,
      yieldWeight: (json['yieldWeight'] as num).toDouble(),
      yieldUnit: json['yieldUnit'] as String? ?? 'g',
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$RecentRecipeToJson(RecentRecipe instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'imageUrl': instance.imageUrl,
      'caloriesPer100g': instance.caloriesPer100g,
      'proteinPer100g': instance.proteinPer100g,
      'carbsPer100g': instance.carbsPer100g,
      'fatPer100g': instance.fatPer100g,
      'yieldWeight': instance.yieldWeight,
      'yieldUnit': instance.yieldUnit,
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
