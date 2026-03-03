import type { FoodEntry } from './food'

export interface DailySummary {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber: number
  calorieGoal: number
  goalMet: boolean
  entries: FoodEntry[]
}

export interface DailyData {
  date: string
  totalCalories: number
  calorieGoal: number
  goalMet: boolean
  entryCount: number
}

export interface WeeklySummary {
  startDate: string
  endDate: string
  days: DailyData[]
  totalCalories: number
  averageCalories: number
  daysLogged: number
  daysOnGoal: number
  weeklyCalorieBudget: number | null
}
