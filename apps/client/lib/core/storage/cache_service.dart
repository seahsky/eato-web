import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../api/models/models.dart';

/// Service for managing offline cache using Hive
class CacheService {
  static const String _dailySummaryBox = 'daily_summaries';
  static const String _recipeBox = 'recipes';
  static const String _achievementBox = 'achievements';
  static const String _profileBox = 'profile';
  static const String _metadataBox = 'cache_metadata';

  static CacheService? _instance;
  static CacheService get instance => _instance ??= CacheService._();

  CacheService._();

  bool _initialized = false;
  bool get isInitialized => _initialized;

  /// Initialize Hive and open boxes
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      await Hive.initFlutter();

      // Open all boxes
      await Future.wait([
        Hive.openBox<String>(_dailySummaryBox),
        Hive.openBox<String>(_recipeBox),
        Hive.openBox<String>(_achievementBox),
        Hive.openBox<String>(_profileBox),
        Hive.openBox<String>(_metadataBox),
      ]);

      _initialized = true;
      if (kDebugMode) {
        debugPrint('CacheService initialized successfully');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('CacheService initialization failed: $e');
      }
    }
  }

  // ============ Daily Summary Cache ============

  /// Cache a daily summary
  Future<void> cacheDailySummary(String dateKey, DailySummary summary) async {
    if (!_initialized) return;
    try {
      final box = Hive.box<String>(_dailySummaryBox);
      final json = jsonEncode(summary.toJson());
      await box.put(dateKey, json);
      await _updateTimestamp(_dailySummaryBox, dateKey);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to cache daily summary: $e');
      }
    }
  }

  /// Get cached daily summary
  DailySummary? getCachedDailySummary(String dateKey) {
    if (!_initialized) return null;
    try {
      final box = Hive.box<String>(_dailySummaryBox);
      final json = box.get(dateKey);
      if (json == null) return null;
      return DailySummary.fromJson(jsonDecode(json));
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to get cached daily summary: $e');
      }
      return null;
    }
  }

  // ============ Recipe Cache ============

  /// Cache user recipes list
  Future<void> cacheUserRecipes(List<Recipe> recipes) async {
    if (!_initialized) return;
    try {
      final box = Hive.box<String>(_recipeBox);
      final json = jsonEncode(recipes.map((r) => r.toJson()).toList());
      await box.put('user_recipes', json);
      await _updateTimestamp(_recipeBox, 'user_recipes');
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to cache user recipes: $e');
      }
    }
  }

  /// Get cached user recipes
  List<Recipe>? getCachedUserRecipes() {
    if (!_initialized) return null;
    try {
      final box = Hive.box<String>(_recipeBox);
      final json = box.get('user_recipes');
      if (json == null) return null;
      final list = jsonDecode(json) as List;
      return list.map((e) => Recipe.fromJson(e)).toList();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to get cached user recipes: $e');
      }
      return null;
    }
  }

  /// Cache partner recipes list
  Future<void> cachePartnerRecipes(List<Recipe> recipes) async {
    if (!_initialized) return;
    try {
      final box = Hive.box<String>(_recipeBox);
      final json = jsonEncode(recipes.map((r) => r.toJson()).toList());
      await box.put('partner_recipes', json);
      await _updateTimestamp(_recipeBox, 'partner_recipes');
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to cache partner recipes: $e');
      }
    }
  }

  /// Get cached partner recipes
  List<Recipe>? getCachedPartnerRecipes() {
    if (!_initialized) return null;
    try {
      final box = Hive.box<String>(_recipeBox);
      final json = box.get('partner_recipes');
      if (json == null) return null;
      final list = jsonDecode(json) as List;
      return list.map((e) => Recipe.fromJson(e)).toList();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to get cached partner recipes: $e');
      }
      return null;
    }
  }

  /// Cache a single recipe
  Future<void> cacheRecipe(Recipe recipe) async {
    if (!_initialized) return;
    try {
      final box = Hive.box<String>(_recipeBox);
      final json = jsonEncode(recipe.toJson());
      await box.put('recipe_${recipe.id}', json);
      await _updateTimestamp(_recipeBox, 'recipe_${recipe.id}');
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to cache recipe: $e');
      }
    }
  }

  /// Get cached recipe by ID
  Recipe? getCachedRecipe(String recipeId) {
    if (!_initialized) return null;
    try {
      final box = Hive.box<String>(_recipeBox);
      final json = box.get('recipe_$recipeId');
      if (json == null) return null;
      return Recipe.fromJson(jsonDecode(json));
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to get cached recipe: $e');
      }
      return null;
    }
  }

  // ============ Achievement Cache ============

  /// Cache achievement summary
  Future<void> cacheAchievementSummary(AchievementSummary summary) async {
    if (!_initialized) return;
    try {
      final box = Hive.box<String>(_achievementBox);
      final json = jsonEncode(summary.toJson());
      await box.put('summary', json);
      await _updateTimestamp(_achievementBox, 'summary');
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to cache achievement summary: $e');
      }
    }
  }

  /// Get cached achievement summary
  AchievementSummary? getCachedAchievementSummary() {
    if (!_initialized) return null;
    try {
      final box = Hive.box<String>(_achievementBox);
      final json = box.get('summary');
      if (json == null) return null;
      return AchievementSummary.fromJson(jsonDecode(json));
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to get cached achievement summary: $e');
      }
      return null;
    }
  }

  // ============ Profile Cache ============

  /// Cache profile
  Future<void> cacheProfile(Profile profile) async {
    if (!_initialized) return;
    try {
      final box = Hive.box<String>(_profileBox);
      final json = jsonEncode(profile.toJson());
      await box.put('profile', json);
      await _updateTimestamp(_profileBox, 'profile');
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to cache profile: $e');
      }
    }
  }

  /// Get cached profile
  Profile? getCachedProfile() {
    if (!_initialized) return null;
    try {
      final box = Hive.box<String>(_profileBox);
      final json = box.get('profile');
      if (json == null) return null;
      return Profile.fromJson(jsonDecode(json));
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to get cached profile: $e');
      }
      return null;
    }
  }

  // ============ Cache Metadata ============

  Future<void> _updateTimestamp(String boxName, String key) async {
    try {
      final metaBox = Hive.box<String>(_metadataBox);
      await metaBox.put('${boxName}_${key}_ts', DateTime.now().toIso8601String());
    } catch (e) {
      // Ignore metadata errors
    }
  }

  /// Get cache timestamp for a key
  DateTime? getCacheTimestamp(String boxName, String key) {
    try {
      final metaBox = Hive.box<String>(_metadataBox);
      final ts = metaBox.get('${boxName}_${key}_ts');
      if (ts == null) return null;
      return DateTime.parse(ts);
    } catch (e) {
      return null;
    }
  }

  /// Check if cache is stale (older than duration)
  bool isCacheStale(String boxName, String key, Duration maxAge) {
    final timestamp = getCacheTimestamp(boxName, key);
    if (timestamp == null) return true;
    return DateTime.now().difference(timestamp) > maxAge;
  }

  // ============ Cache Management ============

  /// Clear all cache
  Future<void> clearAll() async {
    if (!_initialized) return;
    try {
      await Future.wait([
        Hive.box<String>(_dailySummaryBox).clear(),
        Hive.box<String>(_recipeBox).clear(),
        Hive.box<String>(_achievementBox).clear(),
        Hive.box<String>(_profileBox).clear(),
        Hive.box<String>(_metadataBox).clear(),
      ]);
      if (kDebugMode) {
        debugPrint('All cache cleared');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to clear cache: $e');
      }
    }
  }

  /// Clear cache for a specific box
  Future<void> clearBox(String boxName) async {
    if (!_initialized) return;
    try {
      await Hive.box<String>(boxName).clear();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to clear box $boxName: $e');
      }
    }
  }

  /// Invalidate daily summary cache
  Future<void> invalidateDailySummary(String dateKey) async {
    if (!_initialized) return;
    try {
      final box = Hive.box<String>(_dailySummaryBox);
      await box.delete(dateKey);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to invalidate daily summary: $e');
      }
    }
  }

  /// Invalidate recipe cache
  Future<void> invalidateRecipes() async {
    if (!_initialized) return;
    try {
      final box = Hive.box<String>(_recipeBox);
      await box.delete('user_recipes');
      await box.delete('partner_recipes');
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to invalidate recipes: $e');
      }
    }
  }
}
