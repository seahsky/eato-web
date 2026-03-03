import type { ActivityLevel, DisplayMode, EnergyUnit, Gender } from './enums'

export interface Profile {
  id: string
  userId: string
  age: number
  weight: number
  height: number
  gender: Gender
  activityLevel: ActivityLevel
  bmr: number
  tdee: number
  calorieGoal: number
  weeklyCalorieBudget: number | null
  weekStartDay: number
  displayMode: DisplayMode
  energyUnit: EnergyUnit
  createdAt: string
  updatedAt: string
}

export interface ProfileInput {
  age: number
  weight: number
  height: number
  gender: Gender
  activityLevel: ActivityLevel
  calorieGoal?: number
  weeklyCalorieBudget?: number | null
  weekStartDay?: number
  displayMode?: DisplayMode
  energyUnit?: EnergyUnit
}
