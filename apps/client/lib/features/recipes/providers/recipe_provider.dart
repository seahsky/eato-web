import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../../core/storage/cache_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../dashboard/providers/dashboard_provider.dart';
import '../../gamification/providers/gamification_provider.dart';

/// State for recipe list
class RecipeListState {
  final List<Recipe> userRecipes;
  final List<Recipe> partnerRecipes;
  final bool isLoading;
  final String? error;

  const RecipeListState({
    this.userRecipes = const [],
    this.partnerRecipes = const [],
    this.isLoading = false,
    this.error,
  });

  RecipeListState copyWith({
    List<Recipe>? userRecipes,
    List<Recipe>? partnerRecipes,
    bool? isLoading,
    String? error,
  }) {
    return RecipeListState(
      userRecipes: userRecipes ?? this.userRecipes,
      partnerRecipes: partnerRecipes ?? this.partnerRecipes,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  factory RecipeListState.initial() => const RecipeListState();

  /// All recipes combined
  List<Recipe> get allRecipes => [...userRecipes, ...partnerRecipes];

  /// Total recipe count
  int get totalCount => userRecipes.length + partnerRecipes.length;
}

/// Recipe list notifier
class RecipeListNotifier extends StateNotifier<RecipeListState> {
  final ApiClient _apiClient;

  RecipeListNotifier(this._apiClient) : super(RecipeListState.initial());

  /// Fetch all recipes (user's + partner's) with cache-first loading
  Future<void> fetchRecipes() async {
    if (state.isLoading) return;

    final cache = CacheService.instance;

    // Try to load from cache first for instant display
    final cachedUser = cache.getCachedUserRecipes();
    final cachedPartner = cache.getCachedPartnerRecipes();
    if (cachedUser != null || cachedPartner != null) {
      state = state.copyWith(
        userRecipes: cachedUser ?? state.userRecipes,
        partnerRecipes: cachedPartner ?? state.partnerRecipes,
        isLoading: true,
        error: null,
      );
    } else {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final data = await _apiClient.listRecipes();
      final userRecipes = (data['userRecipes'] as List<dynamic>?)
              ?.map((item) => Recipe.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [];
      final partnerRecipes = (data['partnerRecipes'] as List<dynamic>?)
              ?.map((item) => Recipe.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [];

      state = state.copyWith(
        userRecipes: userRecipes,
        partnerRecipes: partnerRecipes,
        isLoading: false,
      );

      // Cache the fresh data
      await cache.cacheUserRecipes(userRecipes);
      await cache.cachePartnerRecipes(partnerRecipes);
    } catch (e) {
      // If we have cached data, keep showing it
      if (cachedUser != null || cachedPartner != null) {
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          error: 'Failed to load recipes: ${e.toString()}',
        );
      }
    }
  }

  /// Refresh recipes
  Future<void> refresh() => fetchRecipes();
}

/// State for a single recipe detail
class RecipeDetailState {
  final Recipe? recipe;
  final bool isLoading;
  final String? error;

  const RecipeDetailState({
    this.recipe,
    this.isLoading = false,
    this.error,
  });

  RecipeDetailState copyWith({
    Recipe? recipe,
    bool? isLoading,
    String? error,
  }) {
    return RecipeDetailState(
      recipe: recipe ?? this.recipe,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Recipe detail notifier
class RecipeDetailNotifier extends StateNotifier<RecipeDetailState> {
  final ApiClient _apiClient;

  RecipeDetailNotifier(this._apiClient) : super(const RecipeDetailState());

  /// Fetch a single recipe by ID
  Future<void> fetchRecipe(String id) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final data = await _apiClient.getRecipe(id);
      final recipe = Recipe.fromJson(data);
      state = state.copyWith(recipe: recipe, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load recipe: ${e.toString()}',
      );
    }
  }

  /// Clear the current recipe
  void clear() {
    state = const RecipeDetailState();
  }
}

/// State for recipe form (create/edit)
class RecipeFormState {
  final String name;
  final String? description;
  final String? imageUrl;
  final double yieldWeight;
  final String yieldUnit;
  final List<RecipeIngredientInput> ingredients;
  final NutritionPreview? nutritionPreview;
  final bool isSaving;
  final bool isPreviewLoading;
  final String? error;
  final Recipe? editingRecipe;

  const RecipeFormState({
    this.name = '',
    this.description,
    this.imageUrl,
    this.yieldWeight = 100,
    this.yieldUnit = 'g',
    this.ingredients = const [],
    this.nutritionPreview,
    this.isSaving = false,
    this.isPreviewLoading = false,
    this.error,
    this.editingRecipe,
  });

  RecipeFormState copyWith({
    String? name,
    String? description,
    String? imageUrl,
    double? yieldWeight,
    String? yieldUnit,
    List<RecipeIngredientInput>? ingredients,
    NutritionPreview? nutritionPreview,
    bool? isSaving,
    bool? isPreviewLoading,
    String? error,
    Recipe? editingRecipe,
  }) {
    return RecipeFormState(
      name: name ?? this.name,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      yieldWeight: yieldWeight ?? this.yieldWeight,
      yieldUnit: yieldUnit ?? this.yieldUnit,
      ingredients: ingredients ?? this.ingredients,
      nutritionPreview: nutritionPreview ?? this.nutritionPreview,
      isSaving: isSaving ?? this.isSaving,
      isPreviewLoading: isPreviewLoading ?? this.isPreviewLoading,
      error: error,
      editingRecipe: editingRecipe ?? this.editingRecipe,
    );
  }

  factory RecipeFormState.initial() => const RecipeFormState();

  /// Check if form is valid for submission
  bool get isValid => name.isNotEmpty && ingredients.isNotEmpty && yieldWeight > 0;

  /// Check if this is an edit operation
  bool get isEditing => editingRecipe != null;
}

/// Recipe form notifier
class RecipeFormNotifier extends StateNotifier<RecipeFormState> {
  final ApiClient _apiClient;
  final Ref _ref;
  Timer? _previewDebounce;

  RecipeFormNotifier(this._apiClient, this._ref) : super(RecipeFormState.initial());

  @override
  void dispose() {
    _previewDebounce?.cancel();
    super.dispose();
  }

  /// Initialize for editing an existing recipe
  void initForEdit(Recipe recipe) {
    final ingredients = recipe.ingredients.map((ing) => RecipeIngredientInput(
      id: ing.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      isPercentage: ing.isPercentage,
      baseIngredientId: ing.baseIngredientId,
      caloriesPer100g: ing.caloriesPer100g,
      proteinPer100g: ing.proteinPer100g,
      carbsPer100g: ing.carbsPer100g,
      fatPer100g: ing.fatPer100g,
      fiberPer100g: ing.fiberPer100g,
      isManualEntry: ing.isManualEntry,
      openFoodFactsId: ing.openFoodFactsId,
      sortOrder: ing.sortOrder,
    )).toList();

    state = RecipeFormState(
      name: recipe.name,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      yieldWeight: recipe.yieldWeight,
      yieldUnit: recipe.yieldUnit,
      ingredients: ingredients,
      editingRecipe: recipe,
    );

    _updateNutritionPreview();
  }

  /// Update recipe name
  void setName(String name) {
    state = state.copyWith(name: name);
  }

  /// Update description
  void setDescription(String? description) {
    state = state.copyWith(description: description);
  }

  /// Update yield weight
  void setYieldWeight(double weight) {
    state = state.copyWith(yieldWeight: weight);
    _schedulePreviewUpdate();
  }

  /// Update yield unit
  void setYieldUnit(String unit) {
    state = state.copyWith(yieldUnit: unit);
  }

  /// Add an ingredient
  void addIngredient(RecipeIngredientInput ingredient) {
    final updated = [...state.ingredients, ingredient];
    state = state.copyWith(ingredients: updated);
    _schedulePreviewUpdate();
  }

  /// Update an ingredient at index
  void updateIngredient(int index, RecipeIngredientInput ingredient) {
    if (index < 0 || index >= state.ingredients.length) return;
    final updated = [...state.ingredients];
    updated[index] = ingredient;
    state = state.copyWith(ingredients: updated);
    _schedulePreviewUpdate();
  }

  /// Remove an ingredient at index
  void removeIngredient(int index) {
    if (index < 0 || index >= state.ingredients.length) return;
    final updated = [...state.ingredients];
    updated.removeAt(index);
    state = state.copyWith(ingredients: updated);
    _schedulePreviewUpdate();
  }

  /// Reorder ingredients
  void reorderIngredients(int oldIndex, int newIndex) {
    final updated = [...state.ingredients];
    if (newIndex > oldIndex) newIndex--;
    final item = updated.removeAt(oldIndex);
    updated.insert(newIndex, item);

    // Update sort orders
    final reordered = updated.asMap().entries.map((e) {
      return RecipeIngredientInput(
        id: e.value.id,
        name: e.value.name,
        quantity: e.value.quantity,
        unit: e.value.unit,
        isPercentage: e.value.isPercentage,
        baseIngredientId: e.value.baseIngredientId,
        caloriesPer100g: e.value.caloriesPer100g,
        proteinPer100g: e.value.proteinPer100g,
        carbsPer100g: e.value.carbsPer100g,
        fatPer100g: e.value.fatPer100g,
        fiberPer100g: e.value.fiberPer100g,
        isManualEntry: e.value.isManualEntry,
        openFoodFactsId: e.value.openFoodFactsId,
        sortOrder: e.key,
      );
    }).toList();

    state = state.copyWith(ingredients: reordered);
  }

  /// Schedule nutrition preview update with debounce
  void _schedulePreviewUpdate() {
    _previewDebounce?.cancel();
    _previewDebounce = Timer(const Duration(milliseconds: 500), () {
      _updateNutritionPreview();
    });
  }

  /// Update nutrition preview from API
  Future<void> _updateNutritionPreview() async {
    if (state.ingredients.isEmpty || state.yieldWeight <= 0) {
      state = state.copyWith(nutritionPreview: null);
      return;
    }

    state = state.copyWith(isPreviewLoading: true);

    try {
      final ingredientsJson = state.ingredients.map((i) => i.toJson()).toList();
      final data = await _apiClient.previewRecipeNutrition({
        'ingredients': ingredientsJson,
        'yieldWeight': state.yieldWeight,
      });
      final preview = NutritionPreview.fromJson(data);
      state = state.copyWith(nutritionPreview: preview, isPreviewLoading: false);
    } catch (e) {
      state = state.copyWith(isPreviewLoading: false);
    }
  }

  /// Save the recipe (create or update)
  Future<Recipe?> save() async {
    if (!state.isValid) {
      state = state.copyWith(error: 'Please fill in all required fields');
      return null;
    }

    state = state.copyWith(isSaving: true, error: null);

    try {
      final input = RecipeInput(
        name: state.name,
        description: state.description,
        imageUrl: state.imageUrl,
        yieldWeight: state.yieldWeight,
        yieldUnit: state.yieldUnit,
        ingredients: state.ingredients,
      );

      Map<String, dynamic> data;
      if (state.isEditing) {
        data = await _apiClient.updateRecipe(state.editingRecipe!.id, input.toJson());
      } else {
        data = await _apiClient.createRecipe(input.toJson());
      }

      final recipe = Recipe.fromJson(data);

      // Refresh recipe list
      _ref.read(recipeListProvider.notifier).refresh();

      state = state.copyWith(isSaving: false);
      return recipe;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Failed to save recipe: ${e.toString()}',
      );
      return null;
    }
  }

  /// Reset the form
  void reset() {
    _previewDebounce?.cancel();
    state = RecipeFormState.initial();
  }
}

/// State for logging a recipe portion
class RecipeLogState {
  final Recipe? recipe;
  final double consumedWeight;
  final MealType mealType;
  final DateTime consumedAt;
  final bool isLogging;
  final String? error;

  const RecipeLogState({
    this.recipe,
    this.consumedWeight = 100,
    this.mealType = MealType.LUNCH,
    required this.consumedAt,
    this.isLogging = false,
    this.error,
  });

  RecipeLogState copyWith({
    Recipe? recipe,
    double? consumedWeight,
    MealType? mealType,
    DateTime? consumedAt,
    bool? isLogging,
    String? error,
  }) {
    return RecipeLogState(
      recipe: recipe ?? this.recipe,
      consumedWeight: consumedWeight ?? this.consumedWeight,
      mealType: mealType ?? this.mealType,
      consumedAt: consumedAt ?? this.consumedAt,
      isLogging: isLogging ?? this.isLogging,
      error: error,
    );
  }

  factory RecipeLogState.initial() => RecipeLogState(consumedAt: DateTime.now());

  /// Calculated nutrition for the portion
  double get calories => recipe?.caloriesForServing(consumedWeight) ?? 0;
  double get protein => recipe?.proteinForServing(consumedWeight) ?? 0;
  double get carbs => recipe?.carbsForServing(consumedWeight) ?? 0;
  double get fat => recipe?.fatForServing(consumedWeight) ?? 0;
}

/// Recipe log notifier
class RecipeLogNotifier extends StateNotifier<RecipeLogState> {
  final ApiClient _apiClient;
  final Ref _ref;

  RecipeLogNotifier(this._apiClient, this._ref) : super(RecipeLogState.initial());

  /// Set the recipe to log
  void setRecipe(Recipe recipe) {
    state = state.copyWith(
      recipe: recipe,
      consumedWeight: recipe.yieldWeight / 2, // Default to half portion
    );
  }

  /// Update consumed weight
  void setConsumedWeight(double weight) {
    state = state.copyWith(consumedWeight: weight);
  }

  /// Update meal type
  void setMealType(MealType mealType) {
    state = state.copyWith(mealType: mealType);
  }

  /// Update consumed date
  void setConsumedAt(DateTime date) {
    state = state.copyWith(consumedAt: date);
  }

  /// Log the recipe portion
  Future<bool> log() async {
    if (state.recipe == null) {
      state = state.copyWith(error: 'No recipe selected');
      return false;
    }

    state = state.copyWith(isLogging: true, error: null);

    try {
      final dateStr =
          '${state.consumedAt.year}-${state.consumedAt.month.toString().padLeft(2, '0')}-${state.consumedAt.day.toString().padLeft(2, '0')}';

      final input = RecipeLogInput(
        recipeId: state.recipe!.id,
        consumedWeight: state.consumedWeight,
        mealType: state.mealType.name,
        consumedAt: dateStr,
      );

      await _apiClient.logRecipe(input.toJson());

      // Refresh dashboard
      _ref.read(dashboardProvider.notifier).refresh();
      
      // Check for new achievements (recipe logging can unlock badges)
      _ref.read(recentAchievementsProvider.notifier).refresh();

      state = state.copyWith(isLogging: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLogging: false,
        error: 'Failed to log recipe: ${e.toString()}',
      );
      return false;
    }
  }

  /// Reset the form
  void reset() {
    state = RecipeLogState.initial();
  }
}

/// State for recipe search
class RecipeSearchState {
  final String query;
  final List<Recipe> results;
  final bool isSearching;
  final String? error;

  const RecipeSearchState({
    this.query = '',
    this.results = const [],
    this.isSearching = false,
    this.error,
  });

  RecipeSearchState copyWith({
    String? query,
    List<Recipe>? results,
    bool? isSearching,
    String? error,
  }) {
    return RecipeSearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      isSearching: isSearching ?? this.isSearching,
      error: error,
    );
  }
}

/// Recipe search notifier
class RecipeSearchNotifier extends StateNotifier<RecipeSearchState> {
  final ApiClient _apiClient;
  Timer? _debounce;

  RecipeSearchNotifier(this._apiClient) : super(const RecipeSearchState());

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  /// Search recipes with debounce
  void search(String query) {
    state = state.copyWith(query: query);

    _debounce?.cancel();

    if (query.trim().isEmpty) {
      state = state.copyWith(results: [], isSearching: false);
      return;
    }

    state = state.copyWith(isSearching: true);

    _debounce = Timer(const Duration(milliseconds: 300), () {
      _executeSearch(query);
    });
  }

  Future<void> _executeSearch(String query) async {
    try {
      final data = await _apiClient.searchRecipes(query);
      final results = data
          .map((item) => Recipe.fromJson(item as Map<String, dynamic>))
          .toList();

      state = state.copyWith(results: results, isSearching: false);
    } catch (e) {
      state = state.copyWith(
        isSearching: false,
        error: 'Search failed: ${e.toString()}',
      );
    }
  }

  /// Clear search
  void clear() {
    _debounce?.cancel();
    state = const RecipeSearchState();
  }
}

// Providers

/// Recipe list provider
final recipeListProvider =
    StateNotifierProvider<RecipeListNotifier, RecipeListState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RecipeListNotifier(apiClient);
});

/// Recipe detail provider
final recipeDetailProvider =
    StateNotifierProvider<RecipeDetailNotifier, RecipeDetailState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RecipeDetailNotifier(apiClient);
});

/// Recipe form provider
final recipeFormProvider =
    StateNotifierProvider<RecipeFormNotifier, RecipeFormState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RecipeFormNotifier(apiClient, ref);
});

/// Recipe log provider
final recipeLogProvider =
    StateNotifierProvider<RecipeLogNotifier, RecipeLogState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RecipeLogNotifier(apiClient, ref);
});

/// Recipe search provider
final recipeSearchProvider =
    StateNotifierProvider<RecipeSearchNotifier, RecipeSearchState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RecipeSearchNotifier(apiClient);
});

/// Recent recipes provider
final recentRecipesProvider = FutureProvider<List<RecentRecipe>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final data = await apiClient.getRecentRecipes(limit: 5);
  return data
      .map((item) => RecentRecipe.fromJson(item as Map<String, dynamic>))
      .toList();
});

/// User recipes convenience provider
final userRecipesProvider = Provider<List<Recipe>>((ref) {
  return ref.watch(recipeListProvider).userRecipes;
});

/// Partner recipes convenience provider
final partnerRecipesProvider = Provider<List<Recipe>>((ref) {
  return ref.watch(recipeListProvider).partnerRecipes;
});
