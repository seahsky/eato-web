import { startOfDay, differenceInCalendarDays, subDays } from "date-fns";

// Streak milestone thresholds for celebrations
export const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;

// Streak freeze configuration
export const MAX_STREAK_FREEZES = 2;
export const FREEZE_EARN_THRESHOLD = 7; // Earn 1 freeze per 7-day streak

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  goalStreak: number;
  longestGoalStreak: number;
  lastLogDate: Date | null;
  streakFreezes: number;
}

export interface StreakUpdateResult {
  newStreak: number;
  longestStreak: number;
  streakBroken: boolean;
  freezeUsed: boolean;
  freezesRemaining: number;
  milestoneCrossed: number | null;
  freezeEarned: boolean;
}

/**
 * Calculate the new streak value when a user logs food
 */
export function calculateStreakUpdate(
  currentData: StreakData,
  logDate: Date
): StreakUpdateResult {
  const today = startOfDay(logDate);
  const lastLog = currentData.lastLogDate
    ? startOfDay(currentData.lastLogDate)
    : null;

  let newStreak = currentData.currentStreak;
  let longestStreak = currentData.longestStreak;
  let streakBroken = false;
  let freezeUsed = false;
  let freezesRemaining = currentData.streakFreezes;
  let milestoneCrossed: number | null = null;
  let freezeEarned = false;

  if (!lastLog) {
    // First log ever - start streak at 1
    newStreak = 1;
  } else {
    const daysSinceLastLog = differenceInCalendarDays(today, lastLog);

    if (daysSinceLastLog === 0) {
      // Same day - no streak change
      return {
        newStreak: currentData.currentStreak,
        longestStreak: currentData.longestStreak,
        streakBroken: false,
        freezeUsed: false,
        freezesRemaining,
        milestoneCrossed: null,
        freezeEarned: false,
      };
    } else if (daysSinceLastLog === 1) {
      // Consecutive day - increment streak
      newStreak = currentData.currentStreak + 1;
    } else if (daysSinceLastLog === 2 && freezesRemaining > 0) {
      // Missed exactly one day - can use a freeze
      freezeUsed = true;
      freezesRemaining -= 1;
      newStreak = currentData.currentStreak + 1; // Continue streak
    } else {
      // Streak broken
      streakBroken = true;
      newStreak = 1;
    }
  }

  // Update longest streak if needed
  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  // Check if a milestone was just crossed
  for (const milestone of STREAK_MILESTONES) {
    if (newStreak === milestone) {
      milestoneCrossed = milestone;
      break;
    }
  }

  // Check if user earned a new freeze (every 7 days)
  if (
    newStreak > 0 &&
    newStreak % FREEZE_EARN_THRESHOLD === 0 &&
    freezesRemaining < MAX_STREAK_FREEZES
  ) {
    freezeEarned = true;
    freezesRemaining = Math.min(freezesRemaining + 1, MAX_STREAK_FREEZES);
  }

  return {
    newStreak,
    longestStreak,
    streakBroken,
    freezeUsed,
    freezesRemaining,
    milestoneCrossed,
    freezeEarned,
  };
}

/**
 * Calculate goal streak update when day ends on goal
 */
export function calculateGoalStreakUpdate(
  currentGoalStreak: number,
  longestGoalStreak: number,
  yesterdayOnGoal: boolean,
  todayOnGoal: boolean
): { goalStreak: number; longestGoalStreak: number } {
  if (!todayOnGoal) {
    return { goalStreak: 0, longestGoalStreak };
  }

  // Today is on goal - increment if yesterday was too
  const newGoalStreak = yesterdayOnGoal ? currentGoalStreak + 1 : 1;
  const newLongestGoalStreak = Math.max(newGoalStreak, longestGoalStreak);

  return {
    goalStreak: newGoalStreak,
    longestGoalStreak: newLongestGoalStreak,
  };
}

/**
 * Check if streak is at risk (user hasn't logged today by evening)
 */
export function isStreakAtRisk(
  lastLogDate: Date | null,
  currentStreak: number,
  currentTime: Date = new Date()
): boolean {
  if (currentStreak === 0 || !lastLogDate) {
    return false;
  }

  const today = startOfDay(currentTime);
  const lastLog = startOfDay(lastLogDate);
  const daysSinceLastLog = differenceInCalendarDays(today, lastLog);

  // Streak at risk if:
  // 1. Last log was yesterday (not today)
  // 2. It's past 8 PM
  const hour = currentTime.getHours();
  return daysSinceLastLog === 1 && hour >= 20;
}

/**
 * Get the next milestone for a given streak
 */
export function getNextMilestone(currentStreak: number): number | null {
  for (const milestone of STREAK_MILESTONES) {
    if (milestone > currentStreak) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get progress toward next milestone (0-100)
 */
export function getMilestoneProgress(currentStreak: number): number {
  const nextMilestone = getNextMilestone(currentStreak);
  if (!nextMilestone) {
    return 100; // All milestones achieved
  }

  // Find previous milestone or 0
  let previousMilestone = 0;
  for (const milestone of STREAK_MILESTONES) {
    if (milestone >= nextMilestone) break;
    if (milestone <= currentStreak) {
      previousMilestone = milestone;
    }
  }

  const range = nextMilestone - previousMilestone;
  const progress = currentStreak - previousMilestone;
  return Math.round((progress / range) * 100);
}

/**
 * Get flame size category based on streak length
 */
export function getFlameSize(
  currentStreak: number
): "none" | "small" | "medium" | "large" | "epic" {
  if (currentStreak === 0) return "none";
  if (currentStreak < 7) return "small";
  if (currentStreak < 30) return "medium";
  if (currentStreak < 90) return "large";
  return "epic";
}
