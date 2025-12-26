// Badge/Achievement definitions for Eato gamification system

export type BadgeCategory = "consistency" | "logging" | "goals" | "partner";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string; // Emoji or icon name
  requirement: string; // Human-readable requirement
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  order: number; // Display order within category
}

// All badge definitions
export const BADGES: Record<string, BadgeDefinition> = {
  // Consistency badges
  first_log: {
    id: "first_log",
    name: "First Bite",
    description: "Logged your first food entry",
    category: "consistency",
    icon: "utensils",
    requirement: "Log 1 food entry",
    rarity: "common",
    order: 1,
  },
  week_warrior: {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Maintained a 7-day logging streak",
    category: "consistency",
    icon: "flame",
    requirement: "7-day streak",
    rarity: "common",
    order: 2,
  },
  fortnight_fighter: {
    id: "fortnight_fighter",
    name: "Fortnight Fighter",
    description: "Maintained a 14-day logging streak",
    category: "consistency",
    icon: "fire",
    requirement: "14-day streak",
    rarity: "uncommon",
    order: 3,
  },
  monthly_master: {
    id: "monthly_master",
    name: "Monthly Master",
    description: "Maintained a 30-day logging streak",
    category: "consistency",
    icon: "calendar",
    requirement: "30-day streak",
    rarity: "rare",
    order: 4,
  },
  sixty_day_sage: {
    id: "sixty_day_sage",
    name: "60-Day Sage",
    description: "Maintained a 60-day logging streak",
    category: "consistency",
    icon: "star",
    requirement: "60-day streak",
    rarity: "epic",
    order: 5,
  },
  century_club: {
    id: "century_club",
    name: "Century Club",
    description: "Maintained a 100-day logging streak",
    category: "consistency",
    icon: "trophy",
    requirement: "100-day streak",
    rarity: "legendary",
    order: 6,
  },
  half_year_hero: {
    id: "half_year_hero",
    name: "Half-Year Hero",
    description: "Maintained a 180-day logging streak",
    category: "consistency",
    icon: "crown",
    requirement: "180-day streak",
    rarity: "legendary",
    order: 7,
  },
  year_legend: {
    id: "year_legend",
    name: "Year Legend",
    description: "Maintained a 365-day logging streak",
    category: "consistency",
    icon: "medal",
    requirement: "365-day streak",
    rarity: "legendary",
    order: 8,
  },

  // Logging badges
  meal_prepper: {
    id: "meal_prepper",
    name: "Meal Prepper",
    description: "Logged all 4 meals in a single day",
    category: "logging",
    icon: "list-check",
    requirement: "Log breakfast, lunch, dinner, and snack in one day",
    rarity: "common",
    order: 1,
  },
  food_explorer: {
    id: "food_explorer",
    name: "Food Explorer",
    description: "Logged 50 unique foods",
    category: "logging",
    icon: "compass",
    requirement: "Log 50 different food items",
    rarity: "uncommon",
    order: 2,
  },
  food_connoisseur: {
    id: "food_connoisseur",
    name: "Food Connoisseur",
    description: "Logged 100 unique foods",
    category: "logging",
    icon: "award",
    requirement: "Log 100 different food items",
    rarity: "rare",
    order: 3,
  },
  barcode_scanner: {
    id: "barcode_scanner",
    name: "Barcode Scanner",
    description: "Logged 10 foods using barcode scan",
    category: "logging",
    icon: "scan",
    requirement: "Scan 10 barcodes",
    rarity: "common",
    order: 4,
  },
  early_bird: {
    id: "early_bird",
    name: "Early Bird",
    description: "Logged breakfast before 9 AM for 7 days",
    category: "logging",
    icon: "sun",
    requirement: "Log breakfast before 9 AM, 7 days in a row",
    rarity: "uncommon",
    order: 5,
  },

  // Goals badges
  goal_getter: {
    id: "goal_getter",
    name: "Goal Getter",
    description: "Stayed on calorie goal for 7 days",
    category: "goals",
    icon: "target",
    requirement: "7-day goal streak",
    rarity: "common",
    order: 1,
  },
  perfect_week: {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Hit calorie goal all 7 days of the week",
    category: "goals",
    icon: "check-circle",
    requirement: "7/7 days on goal in one week",
    rarity: "uncommon",
    order: 2,
  },
  macro_master: {
    id: "macro_master",
    name: "Macro Master",
    description: "Hit all macro targets in a day (within 10%)",
    category: "goals",
    icon: "pie-chart",
    requirement: "Hit protein, carbs, and fat targets in one day",
    rarity: "uncommon",
    order: 3,
  },
  monthly_goal_crusher: {
    id: "monthly_goal_crusher",
    name: "Monthly Goal Crusher",
    description: "Stayed on calorie goal for 30 days",
    category: "goals",
    icon: "zap",
    requirement: "30-day goal streak",
    rarity: "rare",
    order: 4,
  },
  consistency_king: {
    id: "consistency_king",
    name: "Consistency Champion",
    description: "Stayed on calorie goal for 60 days",
    category: "goals",
    icon: "crown",
    requirement: "60-day goal streak",
    rarity: "epic",
    order: 5,
  },

  // Partner badges
  better_together: {
    id: "better_together",
    name: "Better Together",
    description: "Linked with a partner",
    category: "partner",
    icon: "heart",
    requirement: "Link with a partner",
    rarity: "common",
    order: 1,
  },
  accountability_buddy: {
    id: "accountability_buddy",
    name: "Accountability Buddy",
    description: "Both you and partner maintained 7-day streaks",
    category: "partner",
    icon: "users",
    requirement: "7-day mutual streak with partner",
    rarity: "uncommon",
    order: 2,
  },
  power_couple: {
    id: "power_couple",
    name: "Power Couple",
    description: "Both you and partner maintained 30-day streaks",
    category: "partner",
    icon: "zap",
    requirement: "30-day mutual streak with partner",
    rarity: "rare",
    order: 3,
  },
  nudge_master: {
    id: "nudge_master",
    name: "Nudge Master",
    description: "Sent 10 nudges to your partner",
    category: "partner",
    icon: "bell",
    requirement: "Send 10 nudges",
    rarity: "common",
    order: 4,
  },
  supportive_partner: {
    id: "supportive_partner",
    name: "Supportive Partner",
    description: "Logged 5 meals for your partner",
    category: "partner",
    icon: "gift",
    requirement: "Log 5 meals on partner's behalf",
    rarity: "uncommon",
    order: 5,
  },
} as const;

// Get all badges in a category
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return Object.values(BADGES)
    .filter((badge) => badge.category === category)
    .sort((a, b) => a.order - b.order);
}

// Get total badge count
export function getTotalBadgeCount(): number {
  return Object.keys(BADGES).length;
}

// Check which streak badges should be unlocked
export function getStreakBadgesToUnlock(
  currentStreak: number,
  unlockedBadgeIds: string[]
): string[] {
  const streakBadgeThresholds: Record<number, string> = {
    1: "first_log",
    7: "week_warrior",
    14: "fortnight_fighter",
    30: "monthly_master",
    60: "sixty_day_sage",
    100: "century_club",
    180: "half_year_hero",
    365: "year_legend",
  };

  const toUnlock: string[] = [];

  for (const [threshold, badgeId] of Object.entries(streakBadgeThresholds)) {
    if (
      currentStreak >= parseInt(threshold) &&
      !unlockedBadgeIds.includes(badgeId)
    ) {
      toUnlock.push(badgeId);
    }
  }

  return toUnlock;
}

// Check which goal streak badges should be unlocked
export function getGoalStreakBadgesToUnlock(
  goalStreak: number,
  unlockedBadgeIds: string[]
): string[] {
  const goalBadgeThresholds: Record<number, string> = {
    7: "goal_getter",
    30: "monthly_goal_crusher",
    60: "consistency_king",
  };

  const toUnlock: string[] = [];

  for (const [threshold, badgeId] of Object.entries(goalBadgeThresholds)) {
    if (
      goalStreak >= parseInt(threshold) &&
      !unlockedBadgeIds.includes(badgeId)
    ) {
      toUnlock.push(badgeId);
    }
  }

  return toUnlock;
}

// Avatar frame thresholds
export const AVATAR_FRAME_THRESHOLDS = {
  none: 0,
  bronze: 5,
  silver: 15,
  gold: 30,
  diamond: getTotalBadgeCount(),
} as const;

export type AvatarFrame = keyof typeof AVATAR_FRAME_THRESHOLDS;

// Get avatar frame based on badge count
export function getAvatarFrame(badgeCount: number): AvatarFrame {
  if (badgeCount >= AVATAR_FRAME_THRESHOLDS.diamond) return "diamond";
  if (badgeCount >= AVATAR_FRAME_THRESHOLDS.gold) return "gold";
  if (badgeCount >= AVATAR_FRAME_THRESHOLDS.silver) return "silver";
  if (badgeCount >= AVATAR_FRAME_THRESHOLDS.bronze) return "bronze";
  return "none";
}

// Theme unlock thresholds (based on streak)
export const THEME_UNLOCK_THRESHOLDS = {
  default: 0,
  midnight: 7,
  ocean: 30,
  forest: 60,
  sunset: 90,
} as const;

export type ThemeId = keyof typeof THEME_UNLOCK_THRESHOLDS;

// Get unlocked themes based on longest streak
export function getUnlockedThemes(longestStreak: number): ThemeId[] {
  const themes: ThemeId[] = [];
  for (const [themeId, threshold] of Object.entries(THEME_UNLOCK_THRESHOLDS)) {
    if (longestStreak >= threshold) {
      themes.push(themeId as ThemeId);
    }
  }
  return themes;
}
