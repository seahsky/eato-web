// Enums matching the Prisma schema

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export const GenderDisplay: Record<Gender, string> = {
  [Gender.MALE]: 'Male',
  [Gender.FEMALE]: 'Female',
}

export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY',
  LIGHTLY_ACTIVE = 'LIGHTLY_ACTIVE',
  MODERATELY_ACTIVE = 'MODERATELY_ACTIVE',
  ACTIVE = 'ACTIVE',
  VERY_ACTIVE = 'VERY_ACTIVE',
}

export const ActivityLevelDisplay: Record<ActivityLevel, string> = {
  [ActivityLevel.SEDENTARY]: 'Sedentary',
  [ActivityLevel.LIGHTLY_ACTIVE]: 'Lightly Active',
  [ActivityLevel.MODERATELY_ACTIVE]: 'Moderately Active',
  [ActivityLevel.ACTIVE]: 'Active',
  [ActivityLevel.VERY_ACTIVE]: 'Very Active',
}

export const ActivityLevelMultiplier: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHTLY_ACTIVE]: 1.375,
  [ActivityLevel.MODERATELY_ACTIVE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9,
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}

export const MealTypeDisplay: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Breakfast',
  [MealType.LUNCH]: 'Lunch',
  [MealType.DINNER]: 'Dinner',
  [MealType.SNACK]: 'Snack',
}

export enum EnergyUnit {
  KCAL = 'KCAL',
  KJ = 'KJ',
}

export const EnergyUnitDisplay: Record<EnergyUnit, string> = {
  [EnergyUnit.KCAL]: 'kcal',
  [EnergyUnit.KJ]: 'kJ',
}

export enum DisplayMode {
  QUALITATIVE = 'QUALITATIVE',
  EXACT = 'EXACT',
}

export const DisplayModeDisplay: Record<DisplayMode, string> = {
  [DisplayMode.QUALITATIVE]: 'Qualitative',
  [DisplayMode.EXACT]: 'Exact',
}

export enum FoodDataSource {
  FATSECRET = 'FATSECRET',
  MANUAL = 'MANUAL',
  OPEN_FOOD_FACTS = 'OPEN_FOOD_FACTS',
  USDA = 'USDA',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ApprovalStatusDisplay: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: 'Pending',
  [ApprovalStatus.APPROVED]: 'Approved',
  [ApprovalStatus.REJECTED]: 'Rejected',
}
