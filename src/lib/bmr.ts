export type Gender = "MALE" | "FEMALE";

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "ACTIVE"
  | "VERY_ACTIVE";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentary (little or no exercise)",
  LIGHTLY_ACTIVE: "Lightly active (1-3 days/week)",
  MODERATELY_ACTIVE: "Moderately active (3-5 days/week)",
  ACTIVE: "Active (6-7 days/week)",
  VERY_ACTIVE: "Very active (hard exercise daily)",
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Men: BMR = 10W + 6.25H - 5A + 5
 * Women: BMR = 10W + 6.25H - 5A - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(gender === "MALE" ? base + 5 : base - 161);
}

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR * Activity Multiplier
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel
): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Calculate calorie goal based on weight goal
 */
export function calculateCalorieGoal(
  tdee: number,
  goalType: "maintain" | "lose" | "gain" = "maintain",
  intensity: "mild" | "moderate" | "aggressive" = "moderate"
): number {
  const adjustments = {
    mild: 250,
    moderate: 500,
    aggressive: 750,
  };

  switch (goalType) {
    case "lose":
      return Math.max(1200, tdee - adjustments[intensity]);
    case "gain":
      return tdee + adjustments[intensity];
    default:
      return tdee;
  }
}

/**
 * Get macro targets based on calorie goal
 * Default split: 30% protein, 40% carbs, 30% fat
 */
export function calculateMacroTargets(
  calorieGoal: number,
  proteinPercent = 30,
  carbPercent = 40,
  fatPercent = 30
) {
  return {
    protein: Math.round((calorieGoal * (proteinPercent / 100)) / 4), // 4 cal/g
    carbs: Math.round((calorieGoal * (carbPercent / 100)) / 4), // 4 cal/g
    fat: Math.round((calorieGoal * (fatPercent / 100)) / 9), // 9 cal/g
  };
}
