// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'daily_summary.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DailySummary _$DailySummaryFromJson(Map<String, dynamic> json) => DailySummary(
      date: DateTime.parse(json['date'] as String),
      totalCalories: (json['totalCalories'] as num).toDouble(),
      totalProtein: (json['totalProtein'] as num).toDouble(),
      totalCarbs: (json['totalCarbs'] as num).toDouble(),
      totalFat: (json['totalFat'] as num).toDouble(),
      totalFiber: (json['totalFiber'] as num).toDouble(),
      calorieGoal: (json['calorieGoal'] as num).toDouble(),
      bmr: (json['bmr'] as num?)?.toDouble(),
      tdee: (json['tdee'] as num?)?.toDouble(),
      entries: (json['entries'] as List<dynamic>)
          .map((e) => FoodEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      entriesByMeal:
          EntriesByMeal.fromJson(json['entriesByMeal'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$DailySummaryToJson(DailySummary instance) =>
    <String, dynamic>{
      'date': instance.date.toIso8601String(),
      'totalCalories': instance.totalCalories,
      'totalProtein': instance.totalProtein,
      'totalCarbs': instance.totalCarbs,
      'totalFat': instance.totalFat,
      'totalFiber': instance.totalFiber,
      'calorieGoal': instance.calorieGoal,
      'bmr': instance.bmr,
      'tdee': instance.tdee,
      'entries': instance.entries,
      'entriesByMeal': instance.entriesByMeal,
    };

EntriesByMeal _$EntriesByMealFromJson(Map<String, dynamic> json) =>
    EntriesByMeal(
      breakfast: (json['BREAKFAST'] as List<dynamic>)
          .map((e) => FoodEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      lunch: (json['LUNCH'] as List<dynamic>)
          .map((e) => FoodEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      dinner: (json['DINNER'] as List<dynamic>)
          .map((e) => FoodEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      snack: (json['SNACK'] as List<dynamic>)
          .map((e) => FoodEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$EntriesByMealToJson(EntriesByMeal instance) =>
    <String, dynamic>{
      'BREAKFAST': instance.breakfast,
      'LUNCH': instance.lunch,
      'DINNER': instance.dinner,
      'SNACK': instance.snack,
    };

WeeklySummary _$WeeklySummaryFromJson(Map<String, dynamic> json) =>
    WeeklySummary(
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      dailyData: (json['dailyData'] as List<dynamic>)
          .map((e) => DailyData.fromJson(e as Map<String, dynamic>))
          .toList(),
      averageCalories: (json['averageCalories'] as num).toDouble(),
      averageProtein: (json['averageProtein'] as num).toDouble(),
      averageCarbs: (json['averageCarbs'] as num).toDouble(),
      averageFat: (json['averageFat'] as num).toDouble(),
      totalCalories: (json['totalCalories'] as num).toDouble(),
      calorieGoal: (json['calorieGoal'] as num).toDouble(),
      daysLogged: (json['daysLogged'] as num).toInt(),
      daysOnGoal: (json['daysOnGoal'] as num).toInt(),
    );

Map<String, dynamic> _$WeeklySummaryToJson(WeeklySummary instance) =>
    <String, dynamic>{
      'startDate': instance.startDate.toIso8601String(),
      'endDate': instance.endDate.toIso8601String(),
      'dailyData': instance.dailyData,
      'averageCalories': instance.averageCalories,
      'averageProtein': instance.averageProtein,
      'averageCarbs': instance.averageCarbs,
      'averageFat': instance.averageFat,
      'totalCalories': instance.totalCalories,
      'calorieGoal': instance.calorieGoal,
      'daysLogged': instance.daysLogged,
      'daysOnGoal': instance.daysOnGoal,
    };

DailyData _$DailyDataFromJson(Map<String, dynamic> json) => DailyData(
      date: DateTime.parse(json['date'] as String),
      calories: (json['calories'] as num).toDouble(),
      protein: (json['protein'] as num).toDouble(),
      carbs: (json['carbs'] as num).toDouble(),
      fat: (json['fat'] as num).toDouble(),
      goalMet: json['goalMet'] as bool,
    );

Map<String, dynamic> _$DailyDataToJson(DailyData instance) => <String, dynamic>{
      'date': instance.date.toIso8601String(),
      'calories': instance.calories,
      'protein': instance.protein,
      'carbs': instance.carbs,
      'fat': instance.fat,
      'goalMet': instance.goalMet,
    };
