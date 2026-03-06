/**
 * Client-safe type exports for eato-mobile
 *
 * This file provides type definitions that can be consumed by the mobile app
 * without requiring Prisma or other server-side dependencies.
 */

// Re-export AppRouter type for mobile consumption
export type { AppRouter } from './routers'

// Mirror Prisma enums as plain TS types (no Prisma dependency)
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type Gender = 'MALE' | 'FEMALE'
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'ACTIVE'
  | 'VERY_ACTIVE'
export type ApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED'
export type FoodDataSource = 'FATSECRET' | 'MANUAL' | 'OPEN_FOOD_FACTS' | 'USDA'
export type EnergyUnit = 'KCAL' | 'KJ'

// Flame size for streak display
export type FlameSize = 'none' | 'small' | 'medium' | 'large' | 'epic'
