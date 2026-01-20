import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../../dashboard/providers/dashboard_provider.dart';
import '../../gamification/providers/gamification_provider.dart';

/// State for food search
class FoodSearchState {
  final String query;
  final List<FoodProduct> results;
  final bool isSearching;
  final String? error;
  final List<String> recentSearches;

  const FoodSearchState({
    this.query = '',
    this.results = const [],
    this.isSearching = false,
    this.error,
    this.recentSearches = const [],
  });

  FoodSearchState copyWith({
    String? query,
    List<FoodProduct>? results,
    bool? isSearching,
    String? error,
    List<String>? recentSearches,
  }) {
    return FoodSearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      isSearching: isSearching ?? this.isSearching,
      error: error,
      recentSearches: recentSearches ?? this.recentSearches,
    );
  }

  factory FoodSearchState.initial() => const FoodSearchState();
}

/// Food search notifier
class FoodSearchNotifier extends StateNotifier<FoodSearchState> {
  final ApiClient _apiClient;
  Timer? _debounceTimer;

  FoodSearchNotifier(this._apiClient) : super(FoodSearchState.initial());

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  /// Search for food with debouncing (300ms)
  void search(String query) {
    state = state.copyWith(query: query);

    _debounceTimer?.cancel();

    if (query.trim().isEmpty) {
      state = state.copyWith(results: [], isSearching: false);
      return;
    }

    state = state.copyWith(isSearching: true);

    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _executeSearch(query);
    });
  }

  /// Execute the actual search
  Future<void> _executeSearch(String query) async {
    try {
      final data = await _apiClient.searchFood(query);
      final results = data
          .map((item) => FoodProduct.fromJson(item as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        results: results,
        isSearching: false,
        error: null,
      );

      // Add to recent searches if results found
      if (results.isNotEmpty && !state.recentSearches.contains(query)) {
        final updatedRecent = [
          query,
          ...state.recentSearches.take(9),
        ];
        state = state.copyWith(recentSearches: updatedRecent);
      }
    } catch (e) {
      state = state.copyWith(
        isSearching: false,
        error: 'Search failed: ${e.toString()}',
      );
    }
  }

  /// Search by barcode
  Future<FoodProduct?> searchByBarcode(String barcode) async {
    state = state.copyWith(isSearching: true, error: null);

    try {
      final data = await _apiClient.getFoodByBarcode(barcode);
      final product = FoodProduct.fromJson(data);
      state = state.copyWith(isSearching: false);
      return product;
    } catch (e) {
      state = state.copyWith(
        isSearching: false,
        error: 'Barcode lookup failed: ${e.toString()}',
      );
      return null;
    }
  }

  /// Clear search results
  void clearSearch() {
    state = state.copyWith(query: '', results: [], error: null);
  }

  /// Remove from recent searches
  void removeFromRecentSearches(String query) {
    final updated = state.recentSearches.where((s) => s != query).toList();
    state = state.copyWith(recentSearches: updated);
  }

  /// Clear all recent searches
  void clearRecentSearches() {
    state = state.copyWith(recentSearches: []);
  }
}

/// State for adding/editing a food entry
class FoodEntryFormState {
  final FoodProduct? selectedProduct;
  final MealType mealType;
  final double servingSize;
  final String servingUnit;
  final DateTime consumedAt;
  final bool isSaving;
  final String? error;

  const FoodEntryFormState({
    this.selectedProduct,
    this.mealType = MealType.BREAKFAST,
    this.servingSize = 100,
    this.servingUnit = 'g',
    required this.consumedAt,
    this.isSaving = false,
    this.error,
  });

  FoodEntryFormState copyWith({
    FoodProduct? selectedProduct,
    MealType? mealType,
    double? servingSize,
    String? servingUnit,
    DateTime? consumedAt,
    bool? isSaving,
    String? error,
  }) {
    return FoodEntryFormState(
      selectedProduct: selectedProduct ?? this.selectedProduct,
      mealType: mealType ?? this.mealType,
      servingSize: servingSize ?? this.servingSize,
      servingUnit: servingUnit ?? this.servingUnit,
      consumedAt: consumedAt ?? this.consumedAt,
      isSaving: isSaving ?? this.isSaving,
      error: error,
    );
  }

  factory FoodEntryFormState.initial() => FoodEntryFormState(
        consumedAt: DateTime.now(),
      );

  /// Calculate calories based on serving size
  double get calculatedCalories {
    if (selectedProduct == null) return 0;
    return selectedProduct!.caloriesForServing(servingSize);
  }

  /// Calculate protein based on serving size
  double get calculatedProtein {
    if (selectedProduct == null) return 0;
    return selectedProduct!.proteinForServing(servingSize);
  }

  /// Calculate carbs based on serving size
  double get calculatedCarbs {
    if (selectedProduct == null) return 0;
    return selectedProduct!.carbsForServing(servingSize);
  }

  /// Calculate fat based on serving size
  double get calculatedFat {
    if (selectedProduct == null) return 0;
    return selectedProduct!.fatForServing(servingSize);
  }
}

/// Food entry form notifier
class FoodEntryFormNotifier extends StateNotifier<FoodEntryFormState> {
  final ApiClient _apiClient;
  final Ref _ref;

  FoodEntryFormNotifier(this._apiClient, this._ref)
      : super(FoodEntryFormState.initial());

  /// Select a product from search results
  void selectProduct(FoodProduct product) {
    state = state.copyWith(
      selectedProduct: product,
      servingSize: product.servingSize,
      servingUnit: product.servingUnit,
    );
  }

  /// Update meal type
  void setMealType(MealType mealType) {
    state = state.copyWith(mealType: mealType);
  }

  /// Update serving size
  void setServingSize(double size) {
    state = state.copyWith(servingSize: size);
  }

  /// Update serving unit
  void setServingUnit(String unit) {
    state = state.copyWith(servingUnit: unit);
  }

  /// Update consumed at date
  void setConsumedAt(DateTime date) {
    state = state.copyWith(consumedAt: date);
  }

  /// Save the food entry
  Future<bool> saveEntry() async {
    final product = state.selectedProduct;
    if (product == null) {
      state = state.copyWith(error: 'No product selected');
      return false;
    }

    state = state.copyWith(isSaving: true, error: null);

    try {
      final input = FoodEntryInput(
        name: product.name,
        barcode: product.barcode,
        brand: product.brand,
        imageUrl: product.imageUrl,
        calories: state.calculatedCalories,
        protein: state.calculatedProtein,
        carbs: state.calculatedCarbs,
        fat: state.calculatedFat,
        fiber: product.fiberForServing(state.servingSize),
        servingSize: state.servingSize,
        servingUnit: state.servingUnit,
        mealType: state.mealType,
        consumedAt: state.consumedAt,
        dataSource: product.dataSource,
        fatSecretId: product.fatSecretId,
      );

      await _apiClient.createFoodEntry(input.toJson());

      // Refresh the dashboard
      _ref.read(dashboardProvider.notifier).refresh();
      
      // Check for new achievements (food logging can unlock badges)
      _ref.read(recentAchievementsProvider.notifier).refresh();

      state = state.copyWith(isSaving: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Failed to save entry: ${e.toString()}',
      );
      return false;
    }
  }

  /// Save a manual entry (without a product from search)
  Future<bool> saveManualEntry({
    required String name,
    String? brand,
    required double calories,
    double? protein,
    double? carbs,
    double? fat,
    required double servingSize,
    required String servingUnit,
    required MealType mealType,
    required DateTime consumedAt,
  }) async {
    state = state.copyWith(isSaving: true, error: null);

    try {
      final input = FoodEntryInput(
        name: name,
        brand: brand,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        servingSize: servingSize,
        servingUnit: servingUnit,
        mealType: mealType,
        consumedAt: consumedAt,
        isManualEntry: true,
        dataSource: FoodDataSource.MANUAL,
      );

      await _apiClient.createFoodEntry(input.toJson());

      // Refresh the dashboard
      _ref.read(dashboardProvider.notifier).refresh();
      
      // Check for new achievements (food logging can unlock badges)
      _ref.read(recentAchievementsProvider.notifier).refresh();

      state = state.copyWith(isSaving: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: 'Failed to save entry: ${e.toString()}',
      );
      return false;
    }
  }

  /// Delete a food entry
  Future<bool> deleteEntry(String entryId) async {
    try {
      await _apiClient.deleteFoodEntry(entryId);
      _ref.read(dashboardProvider.notifier).refresh();
      return true;
    } catch (e) {
      state = state.copyWith(error: 'Failed to delete entry: ${e.toString()}');
      return false;
    }
  }

  /// Reset the form
  void reset() {
    state = FoodEntryFormState.initial();
  }
}

// Providers

/// Food search provider
final foodSearchProvider =
    StateNotifierProvider<FoodSearchNotifier, FoodSearchState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return FoodSearchNotifier(apiClient);
});

/// Food entry form provider
final foodEntryFormProvider =
    StateNotifierProvider<FoodEntryFormNotifier, FoodEntryFormState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return FoodEntryFormNotifier(apiClient, ref);
});

/// Search results provider for convenience
final foodSearchResultsProvider = Provider<List<FoodProduct>>((ref) {
  return ref.watch(foodSearchProvider).results;
});

/// Is searching provider
final isFoodSearchingProvider = Provider<bool>((ref) {
  return ref.watch(foodSearchProvider).isSearching;
});

/// Recent searches provider
final recentSearchesProvider = Provider<List<String>>((ref) {
  return ref.watch(foodSearchProvider).recentSearches;
});
