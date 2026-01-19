/**
 * Weekly Budget Utilities
 *
 * Handles week boundary calculations and budget projections
 * to support flexible weekly calorie budgeting.
 */

import {
  startOfWeek,
  endOfWeek,
  differenceInDays,
  format,
  addDays,
} from "date-fns";
import { type EnergyBalanceLevel, getEnergyBalance } from "./energy-balance";

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeekBounds {
  start: Date;
  end: Date;
}

export interface WeeklyBudgetStatus {
  // Weekly totals
  weeklyBudget: number;
  weeklyConsumed: number;
  weeklyRemaining: number;
  weeklyPercentage: number;
  weeklyBalance: EnergyBalanceLevel;

  // Daily context
  dailyConsumed: number;
  dailyGoal: number;
  dailyBalance: EnergyBalanceLevel;

  // Week progress
  daysLogged: number;
  daysInWeek: number;
  daysRemaining: number;
  weekStartDate: Date;
  weekEndDate: Date;

  // Suggested daily budget
  suggestedDailyBudget: number;
}

/**
 * Get the start and end dates for the week containing the given date
 */
export function getWeekBounds(
  date: Date,
  weekStartDay: WeekStartDay = 0
): WeekBounds {
  return {
    start: startOfWeek(date, { weekStartsOn: weekStartDay }),
    end: endOfWeek(date, { weekStartsOn: weekStartDay }),
  };
}

/**
 * Calculate how many days are remaining in the current week
 */
export function getDaysRemainingInWeek(
  date: Date,
  weekStartDay: WeekStartDay = 0
): number {
  const { end } = getWeekBounds(date, weekStartDay);
  return Math.max(0, differenceInDays(end, date));
}

/**
 * Calculate the suggested daily budget based on remaining weekly budget
 */
export function getSuggestedDailyBudget(
  weeklyRemaining: number,
  daysRemaining: number,
  minimumDaily: number = 1200 // Never suggest below this
): number {
  if (daysRemaining <= 0) return minimumDaily;

  const suggested = Math.round(weeklyRemaining / daysRemaining);
  return Math.max(suggested, minimumDaily);
}

/**
 * Calculate the effective weekly budget
 * If weeklyCalorieBudget is not set, calculate from daily goal × 7
 */
export function getEffectiveWeeklyBudget(
  dailyGoal: number,
  weeklyCalorieBudget: number | null | undefined
): number {
  return weeklyCalorieBudget ?? dailyGoal * 7;
}

/**
 * Calculate full weekly budget status
 */
export function calculateWeeklyBudgetStatus(params: {
  date: Date;
  dailyConsumed: number;
  dailyGoal: number;
  weeklyConsumed: number;
  weeklyCalorieBudget: number | null | undefined;
  daysLogged: number;
  weekStartDay?: WeekStartDay;
}): WeeklyBudgetStatus {
  const {
    date,
    dailyConsumed,
    dailyGoal,
    weeklyConsumed,
    weeklyCalorieBudget,
    daysLogged,
    weekStartDay = 0,
  } = params;

  const { start, end } = getWeekBounds(date, weekStartDay);
  const weeklyBudget = getEffectiveWeeklyBudget(dailyGoal, weeklyCalorieBudget);
  const weeklyRemaining = Math.max(0, weeklyBudget - weeklyConsumed);
  const daysRemaining = getDaysRemainingInWeek(date, weekStartDay);

  return {
    // Weekly totals
    weeklyBudget,
    weeklyConsumed,
    weeklyRemaining,
    weeklyPercentage: weeklyBudget > 0 ? (weeklyConsumed / weeklyBudget) * 100 : 0,
    weeklyBalance: getEnergyBalance(weeklyConsumed, weeklyBudget),

    // Daily context
    dailyConsumed,
    dailyGoal,
    dailyBalance: getEnergyBalance(dailyConsumed, dailyGoal),

    // Week progress
    daysLogged,
    daysInWeek: 7,
    daysRemaining,
    weekStartDate: start,
    weekEndDate: end,

    // Suggested daily budget
    suggestedDailyBudget: getSuggestedDailyBudget(weeklyRemaining, daysRemaining + 1), // +1 includes today
  };
}

/**
 * Format the week range for display
 */
export function formatWeekRange(start: Date, end: Date): string {
  const startStr = format(start, "MMM d");
  const endStr = format(end, "MMM d");
  return `${startStr} - ${endStr}`;
}

/**
 * Get array of dates in the current week
 */
export function getWeekDates(
  date: Date,
  weekStartDay: WeekStartDay = 0
): Date[] {
  const { start } = getWeekBounds(date, weekStartDay);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
