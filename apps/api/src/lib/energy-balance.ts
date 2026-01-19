/**
 * Energy Balance Utilities
 *
 * Provides qualitative categorization of calorie consumption
 * to reduce anxiety around exact numbers.
 *
 * Thresholds (strict ±10%):
 * - LIGHT: < 90% of goal
 * - BALANCED: 90-100% of goal
 * - FULL: > 100% of goal
 */

export type EnergyBalanceLevel = "LIGHT" | "BALANCED" | "FULL";

export interface EnergyBalanceThresholds {
  lightMax: number; // < this = LIGHT
  balancedMax: number; // <= this = BALANCED, > this = FULL
}

export const DEFAULT_THRESHOLDS: EnergyBalanceThresholds = {
  lightMax: 0.9, // < 90%
  balancedMax: 1.0, // <= 100%
};

/**
 * Calculate the energy balance level based on consumed vs goal
 */
export function getEnergyBalance(
  consumed: number,
  goal: number,
  thresholds: EnergyBalanceThresholds = DEFAULT_THRESHOLDS
): EnergyBalanceLevel {
  if (goal <= 0) return "BALANCED"; // Edge case: no goal set

  const ratio = consumed / goal;

  if (ratio < thresholds.lightMax) return "LIGHT";
  if (ratio <= thresholds.balancedMax) return "BALANCED";
  return "FULL";
}

/**
 * Human-readable labels for energy balance levels
 */
export const BALANCE_LABELS: Record<EnergyBalanceLevel, string> = {
  LIGHT: "Light",
  BALANCED: "Balanced",
  FULL: "Full",
};

/**
 * CSS custom property colors for energy balance levels
 */
export const BALANCE_COLORS: Record<EnergyBalanceLevel, string> = {
  LIGHT: "var(--success)", // Green
  BALANCED: "var(--chart-3)", // Amber/Orange
  FULL: "var(--destructive)", // Red
};

/**
 * Get the color for a given energy balance level
 */
export function getEnergyBalanceColor(level: EnergyBalanceLevel): string {
  return BALANCE_COLORS[level];
}

/**
 * Get the human-readable label for a given energy balance level
 */
export function getEnergyBalanceLabel(level: EnergyBalanceLevel): string {
  return BALANCE_LABELS[level];
}

/**
 * Weekly status message combining daily and weekly balance
 */
export function getWeeklyStatusMessage(
  dailyBalance: EnergyBalanceLevel,
  weeklyBalance: EnergyBalanceLevel
): string {
  const dailyLabel = BALANCE_LABELS[dailyBalance];
  const weeklyStatus =
    weeklyBalance === "FULL" ? "Over budget this week" : "On track this week";

  return `${dailyLabel} today, ${weeklyStatus}`;
}

/**
 * Check if a balance level indicates being on track
 */
export function isOnTrack(level: EnergyBalanceLevel): boolean {
  return level === "LIGHT" || level === "BALANCED";
}
