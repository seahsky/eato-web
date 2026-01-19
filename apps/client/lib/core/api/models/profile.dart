import 'package:json_annotation/json_annotation.dart';
import 'enums.dart';

part 'profile.g.dart';

@JsonSerializable()
class Profile {
  final String id;
  final String userId;
  final int age;
  final double weight;
  final double height;
  final Gender gender;
  final ActivityLevel activityLevel;
  final double bmr;
  final double tdee;
  final double calorieGoal;
  final double? weeklyCalorieBudget;
  final int weekStartDay;
  final DisplayMode displayMode;
  final EnergyUnit energyUnit;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Profile({
    required this.id,
    required this.userId,
    required this.age,
    required this.weight,
    required this.height,
    required this.gender,
    required this.activityLevel,
    required this.bmr,
    required this.tdee,
    required this.calorieGoal,
    this.weeklyCalorieBudget,
    this.weekStartDay = 0,
    this.displayMode = DisplayMode.QUALITATIVE,
    this.energyUnit = EnergyUnit.KCAL,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Profile.fromJson(Map<String, dynamic> json) => _$ProfileFromJson(json);
  Map<String, dynamic> toJson() => _$ProfileToJson(this);

  Profile copyWith({
    String? id,
    String? userId,
    int? age,
    double? weight,
    double? height,
    Gender? gender,
    ActivityLevel? activityLevel,
    double? bmr,
    double? tdee,
    double? calorieGoal,
    double? weeklyCalorieBudget,
    int? weekStartDay,
    DisplayMode? displayMode,
    EnergyUnit? energyUnit,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Profile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      age: age ?? this.age,
      weight: weight ?? this.weight,
      height: height ?? this.height,
      gender: gender ?? this.gender,
      activityLevel: activityLevel ?? this.activityLevel,
      bmr: bmr ?? this.bmr,
      tdee: tdee ?? this.tdee,
      calorieGoal: calorieGoal ?? this.calorieGoal,
      weeklyCalorieBudget: weeklyCalorieBudget ?? this.weeklyCalorieBudget,
      weekStartDay: weekStartDay ?? this.weekStartDay,
      displayMode: displayMode ?? this.displayMode,
      energyUnit: energyUnit ?? this.energyUnit,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Calculate protein goal (30% of calories, 4 cal/g)
  double get proteinGoal => (calorieGoal * 0.30) / 4;

  /// Calculate carbs goal (40% of calories, 4 cal/g)
  double get carbsGoal => (calorieGoal * 0.40) / 4;

  /// Calculate fat goal (30% of calories, 9 cal/g)
  double get fatGoal => (calorieGoal * 0.30) / 9;
}

/// Input data for creating or updating a profile
@JsonSerializable()
class ProfileInput {
  final int age;
  final double weight;
  final double height;
  final Gender gender;
  final ActivityLevel activityLevel;
  final double? calorieGoal;
  final EnergyUnit? energyUnit;

  const ProfileInput({
    required this.age,
    required this.weight,
    required this.height,
    required this.gender,
    required this.activityLevel,
    this.calorieGoal,
    this.energyUnit,
  });

  factory ProfileInput.fromJson(Map<String, dynamic> json) =>
      _$ProfileInputFromJson(json);
  Map<String, dynamic> toJson() => _$ProfileInputToJson(this);
}

/// Preview of BMR/TDEE calculation before saving
@JsonSerializable()
class BmrTdeePreview {
  final double bmr;
  final double tdee;
  final double suggestedGoal;

  const BmrTdeePreview({
    required this.bmr,
    required this.tdee,
    required this.suggestedGoal,
  });

  factory BmrTdeePreview.fromJson(Map<String, dynamic> json) =>
      _$BmrTdeePreviewFromJson(json);
  Map<String, dynamic> toJson() => _$BmrTdeePreviewToJson(this);
}
