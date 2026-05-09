import { prisma } from "@/lib/prisma";
import {
  calculateStreakUpdateWithRestDays,
  calculateWeeklyStreakUpdate,
  shouldResetRestDays,
  MAX_REST_DAYS_PER_MONTH,
} from "@/lib/gamification/streaks";
import {
  getStreakBadgesToUnlock,
  getWeeklyStreakBadgesToUnlock,
} from "@/lib/gamification/badges";
import { notifyBadgeUnlocked } from "@/lib/notifications/triggers";
import type { FoodEntry, MealType, FoodDataSource } from "@prisma/client";

/**
 * Shared helper used by both food.log and mealMoment.submit to create a
 * FoodEntry, atomically update DailyLog totals, refresh streaks, and unlock
 * any earned badges. Returns the created FoodEntry.
 *
 * Keeping this in a single place ensures synchronous meal moment entries
 * count toward streaks the same way as direct logs (the plan's intent —
 * "no new streak type for v1").
 */
export async function createFoodEntry(args: {
  userId: string;
  consumedAtDate: string; // YYYY-MM-DD
  data: {
    name: string;
    barcode?: string;
    brand?: string | null;
    imageUrl?: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    servingSize: number;
    servingUnit: string;
    mealType?: MealType | null;
    mood?: string;
    note?: string;
    isManualEntry?: boolean;
    dataSource?: FoodDataSource;
    fatSecretId?: string;
    openFoodFactsId?: string;
    usdaFdcId?: number;
    mealGroupId?: string;
  };
}): Promise<FoodEntry> {
  const dayStart = new Date(args.consumedAtDate + "T00:00:00.000Z");
  const consumedAt = new Date(args.consumedAtDate + "T12:00:00.000Z");

  // Resolve / create today's DailyLog using the user's calorieGoal.
  const profile = await prisma.profile.findUnique({
    where: { userId: args.userId },
  });
  const calorieGoal = profile?.calorieGoal ?? 2000;

  let dailyLog = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: args.userId, date: dayStart } },
  });
  if (!dailyLog) {
    dailyLog = await prisma.dailyLog.create({
      data: { userId: args.userId, date: dayStart, calorieGoal },
    });
  }

  // Drop fields that don't belong to FoodEntry (mealGroupId is in FoodEntry,
  // but we filter to known properties to avoid Prisma rejecting unknowns).
  const entry = await prisma.foodEntry.create({
    data: {
      userId: args.userId,
      dailyLogId: dailyLog.id,
      consumedAt,
      name: args.data.name,
      barcode: args.data.barcode,
      brand: args.data.brand ?? undefined,
      imageUrl: args.data.imageUrl,
      calories: args.data.calories,
      protein: args.data.protein,
      carbs: args.data.carbs,
      fat: args.data.fat,
      fiber: args.data.fiber,
      sugar: args.data.sugar,
      sodium: args.data.sodium,
      servingSize: args.data.servingSize,
      servingUnit: args.data.servingUnit,
      mealType: args.data.mealType ?? undefined,
      mood: args.data.mood,
      note: args.data.note,
      isManualEntry: args.data.isManualEntry ?? false,
      dataSource: args.data.dataSource ?? "MANUAL",
      fatSecretId: args.data.fatSecretId,
      openFoodFactsId: args.data.openFoodFactsId,
      usdaFdcId: args.data.usdaFdcId,
      mealGroupId: args.data.mealGroupId,
    },
  });

  const updatedLog = await prisma.dailyLog.update({
    where: { id: dailyLog.id },
    data: {
      totalCalories: { increment: args.data.calories },
      totalProtein: { increment: args.data.protein ?? 0 },
      totalCarbs: { increment: args.data.carbs ?? 0 },
      totalFat: { increment: args.data.fat ?? 0 },
      totalFiber: { increment: args.data.fiber ?? 0 },
    },
  });

  // Streak + weekly + badge updates — mirrors food.log inline behavior so
  // synchronous meal moment entries count exactly the same.
  const userData = await prisma.user.findUnique({
    where: { id: args.userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      goalStreak: true,
      longestGoalStreak: true,
      lastLogDate: true,
      streakFreezes: true,
      restDayDates: true,
      restDaysRemaining: true,
      lastRestDayReset: true,
      weeklyStreak: true,
      longestWeeklyStreak: true,
      currentWeekDays: true,
      weekStartDate: true,
      achievements: { select: { badgeId: true } },
      name: true,
    },
  });

  if (userData) {
    const needsRestDayReset = shouldResetRestDays(userData.lastRestDayReset);

    const streakResult = calculateStreakUpdateWithRestDays(
      {
        currentStreak: userData.currentStreak,
        longestStreak: userData.longestStreak,
        goalStreak: userData.goalStreak,
        longestGoalStreak: userData.longestGoalStreak,
        lastLogDate: userData.lastLogDate,
        streakFreezes: userData.streakFreezes,
        restDayDates: userData.restDayDates,
        restDaysRemaining: userData.restDaysRemaining,
        lastRestDayReset: userData.lastRestDayReset,
      },
      consumedAt
    );

    const weeklyResult = calculateWeeklyStreakUpdate(
      {
        weeklyStreak: userData.weeklyStreak,
        longestWeeklyStreak: userData.longestWeeklyStreak,
        currentWeekDays: userData.currentWeekDays,
        weekStartDate: userData.weekStartDate,
      },
      consumedAt
    );

    await prisma.user.update({
      where: { id: args.userId },
      data: {
        currentStreak: streakResult.newStreak,
        longestStreak: streakResult.longestStreak,
        streakFreezes: streakResult.freezesRemaining,
        lastLogDate: consumedAt,
        weeklyStreak: weeklyResult.weeklyStreak,
        longestWeeklyStreak: weeklyResult.longestWeeklyStreak,
        currentWeekDays: weeklyResult.currentWeekDays,
        weekStartDate: weeklyResult.weekStartDate,
        ...(needsRestDayReset && {
          restDaysRemaining: MAX_REST_DAYS_PER_MONTH,
          lastRestDayReset: new Date(),
        }),
      },
    });

    const unlockedBadgeIds = userData.achievements.map((a) => a.badgeId);
    const newDailyBadges = getStreakBadgesToUnlock(
      streakResult.newStreak,
      unlockedBadgeIds
    );
    const newWeeklyBadges = getWeeklyStreakBadgesToUnlock(
      weeklyResult.weeklyStreak,
      unlockedBadgeIds
    );
    const newBadges = [...newDailyBadges, ...newWeeklyBadges];

    for (const badgeId of newBadges) {
      try {
        await prisma.achievement.create({
          data: { userId: args.userId, badgeId },
        });
      } catch {
        // Ignore duplicate-key errors.
      }
    }

    if (newBadges.length > 0) {
      const { BADGES } = await import("@/lib/gamification/badges");
      const badgeNames = newBadges
        .map((id) => BADGES[id]?.name)
        .filter(Boolean) as string[];
      notifyBadgeUnlocked(args.userId, badgeNames).catch(() => {});
    }
  }

  // goalMet recompute, identical to food.log.
  const goalProgress = updatedLog.totalCalories / updatedLog.calorieGoal;
  if (!updatedLog.goalMet && goalProgress >= 0.9 && goalProgress <= 1.0) {
    await prisma.dailyLog.update({
      where: { id: dailyLog.id },
      data: { goalMet: true },
    });
  }

  return entry;
}

/**
 * Map a meal moment label like "Breakfast"/"Lunch"/"Dinner" to a MealType.
 * Custom labels fall back to SNACK.
 */
export function inferMealTypeFromLabel(label: string): MealType {
  const normalized = label.trim().toUpperCase();
  if (normalized === "BREAKFAST") return "BREAKFAST";
  if (normalized === "LUNCH") return "LUNCH";
  if (normalized === "DINNER") return "DINNER";
  return "SNACK";
}
