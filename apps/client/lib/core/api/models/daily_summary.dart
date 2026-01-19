import 'package:json_annotation/json_annotation.dart';
import 'food_entry.dart';
import 'enums.dart';

part 'daily_summary.g.dart';

/// Summary of a single day's food intake
@JsonSerializable()
class DailySummary {
  final DateTime date;
  final double totalCalories;
  final double totalProtein;
  final double totalCarbs;
  final double totalFat;
  final double totalFiber;
  final double calorieGoal;
  final double? bmr;
  final double? tdee;
  final List<FoodEntry> entries;
  final EntriesByMeal entriesByMeal;

  const DailySummary({
    required this.date,
    required this.totalCalories,
    required this.totalProtein,
    required this.totalCarbs,
    required this.totalFat,
    required this.totalFiber,
    required this.calorieGoal,
    this.bmr,
    this.tdee,
    required this.entries,
    required this.entriesByMeal,
  });

  factory DailySummary.fromJson(Map<String, dynamic> json) =>
      _$DailySummaryFromJson(json);
  Map<String, dynamic> toJson() => _$DailySummaryToJson(this);

  /// Progress percentage towards calorie goal (0.0 to 1.0+)
  double get calorieProgress =>
      calorieGoal > 0 ? totalCalories / calorieGoal : 0.0;

  /// Remaining calories for the day
  double get remainingCalories => calorieGoal - totalCalories;

  /// Whether the user has met their calorie goal
  bool get goalMet => totalCalories >= calorieGoal * 0.9 &&
                       totalCalories <= calorieGoal * 1.1;

  /// Empty summary for when no data exists
  factory DailySummary.empty(DateTime date, double calorieGoal) {
    return DailySummary(
      date: date,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      calorieGoal: calorieGoal,
      entries: const [],
      entriesByMeal: const EntriesByMeal(
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      ),
    );
  }
}

/// Food entries grouped by meal type
@JsonSerializable()
class EntriesByMeal {
  @JsonKey(name: 'BREAKFAST')
  final List<FoodEntry> breakfast;
  @JsonKey(name: 'LUNCH')
  final List<FoodEntry> lunch;
  @JsonKey(name: 'DINNER')
  final List<FoodEntry> dinner;
  @JsonKey(name: 'SNACK')
  final List<FoodEntry> snack;

  const EntriesByMeal({
    required this.breakfast,
    required this.lunch,
    required this.dinner,
    required this.snack,
  });

  factory EntriesByMeal.fromJson(Map<String, dynamic> json) =>
      _$EntriesByMealFromJson(json);
  Map<String, dynamic> toJson() => _$EntriesByMealToJson(this);

  /// Get entries for a specific meal type
  List<FoodEntry> forMealType(MealType mealType) {
    switch (mealType) {
      case MealType.BREAKFAST:
        return breakfast;
      case MealType.LUNCH:
        return lunch;
      case MealType.DINNER:
        return dinner;
      case MealType.SNACK:
        return snack;
    }
  }

  /// Calculate total calories for a meal type
  double caloriesForMeal(MealType mealType) {
    return forMealType(mealType).fold(0.0, (sum, entry) => sum + entry.calories);
  }
}

/// Summary of a week's food intake
@JsonSerializable()
class WeeklySummary {
  final DateTime startDate;
  final DateTime endDate;
  final List<DailyData> dailyData;
  final double averageCalories;
  final double averageProtein;
  final double averageCarbs;
  final double averageFat;
  final double totalCalories;
  final double calorieGoal;
  final int daysLogged;
  final int daysOnGoal;

  const WeeklySummary({
    required this.startDate,
    required this.endDate,
    required this.dailyData,
    required this.averageCalories,
    required this.averageProtein,
    required this.averageCarbs,
    required this.averageFat,
    required this.totalCalories,
    required this.calorieGoal,
    required this.daysLogged,
    required this.daysOnGoal,
  });

  factory WeeklySummary.fromJson(Map<String, dynamic> json) =>
      _$WeeklySummaryFromJson(json);
  Map<String, dynamic> toJson() => _$WeeklySummaryToJson(this);

  /// Weekly progress percentage
  double get weeklyProgress =>
      (calorieGoal * 7) > 0 ? totalCalories / (calorieGoal * 7) : 0.0;
}

/// Daily data point for weekly summary chart
@JsonSerializable()
class DailyData {
  final DateTime date;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final bool goalMet;

  const DailyData({
    required this.date,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.goalMet,
  });

  factory DailyData.fromJson(Map<String, dynamic> json) =>
      _$DailyDataFromJson(json);
  Map<String, dynamic> toJson() => _$DailyDataToJson(this);
}
