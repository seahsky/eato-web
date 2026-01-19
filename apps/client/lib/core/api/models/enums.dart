// Enums matching the Prisma schema

enum Gender {
  MALE,
  FEMALE;

  String get displayName {
    switch (this) {
      case Gender.MALE:
        return 'Male';
      case Gender.FEMALE:
        return 'Female';
    }
  }
}

enum ActivityLevel {
  SEDENTARY,
  LIGHTLY_ACTIVE,
  MODERATELY_ACTIVE,
  ACTIVE,
  VERY_ACTIVE;

  String get displayName {
    switch (this) {
      case ActivityLevel.SEDENTARY:
        return 'Sedentary';
      case ActivityLevel.LIGHTLY_ACTIVE:
        return 'Lightly Active';
      case ActivityLevel.MODERATELY_ACTIVE:
        return 'Moderately Active';
      case ActivityLevel.ACTIVE:
        return 'Active';
      case ActivityLevel.VERY_ACTIVE:
        return 'Very Active';
    }
  }

  double get multiplier {
    switch (this) {
      case ActivityLevel.SEDENTARY:
        return 1.2;
      case ActivityLevel.LIGHTLY_ACTIVE:
        return 1.375;
      case ActivityLevel.MODERATELY_ACTIVE:
        return 1.55;
      case ActivityLevel.ACTIVE:
        return 1.725;
      case ActivityLevel.VERY_ACTIVE:
        return 1.9;
    }
  }
}

enum MealType {
  BREAKFAST,
  LUNCH,
  DINNER,
  SNACK;

  String get displayName {
    switch (this) {
      case MealType.BREAKFAST:
        return 'Breakfast';
      case MealType.LUNCH:
        return 'Lunch';
      case MealType.DINNER:
        return 'Dinner';
      case MealType.SNACK:
        return 'Snack';
    }
  }
}

enum EnergyUnit {
  KCAL,
  KJ;

  String get displayName {
    switch (this) {
      case EnergyUnit.KCAL:
        return 'kcal';
      case EnergyUnit.KJ:
        return 'kJ';
    }
  }
}

enum DisplayMode {
  QUALITATIVE,
  EXACT;

  String get displayName {
    switch (this) {
      case DisplayMode.QUALITATIVE:
        return 'Qualitative';
      case DisplayMode.EXACT:
        return 'Exact';
    }
  }
}

enum FoodDataSource {
  FATSECRET,
  MANUAL,
  OPEN_FOOD_FACTS,
  USDA;
}

enum ApprovalStatus {
  PENDING,
  APPROVED,
  REJECTED;

  String get displayName {
    switch (this) {
      case ApprovalStatus.PENDING:
        return 'Pending';
      case ApprovalStatus.APPROVED:
        return 'Approved';
      case ApprovalStatus.REJECTED:
        return 'Rejected';
    }
  }
}
