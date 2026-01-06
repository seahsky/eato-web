import { getAgenda } from "./index";
import { prisma } from "@/lib/prisma";
import type { MealType } from "@prisma/client";

type ReminderType = "breakfast" | "lunch" | "dinner";

const MEAL_TYPE_MAP: Record<ReminderType, MealType> = {
  breakfast: "BREAKFAST",
  lunch: "LUNCH",
  dinner: "DINNER",
};

/**
 * Schedule or reschedule a meal reminder for a user
 * @param userId User ID
 * @param reminderType Meal type (breakfast, lunch, dinner)
 * @param time Time in HH:MM format (user's local time)
 * @param timezone IANA timezone (e.g., "America/New_York")
 */
export async function scheduleMealReminder(
  userId: string,
  reminderType: ReminderType,
  time: string,
  timezone: string
): Promise<void> {
  const agenda = await getAgenda();
  const mealType = MEAL_TYPE_MAP[reminderType];

  // Cancel existing job for this user/meal combo
  await agenda.cancel({
    name: "send-meal-reminder",
    "data.userId": userId,
    "data.mealType": mealType,
  });

  // Parse time (HH:MM)
  const [hours, minutes] = time.split(":").map(Number);

  // Schedule daily at the specified time in user's timezone
  // Agenda uses cron-style scheduling with timezone support
  await agenda.every(
    `${minutes} ${hours} * * *`, // Cron: at HH:MM every day
    "send-meal-reminder",
    {
      userId,
      mealType,
    },
    {
      timezone,
      skipImmediate: true, // Don't run immediately
    }
  );
}

/**
 * Cancel a meal reminder for a user
 */
export async function cancelMealReminder(
  userId: string,
  reminderType: ReminderType
): Promise<void> {
  const agenda = await getAgenda();
  const mealType = MEAL_TYPE_MAP[reminderType];

  await agenda.cancel({
    name: "send-meal-reminder",
    "data.userId": userId,
    "data.mealType": mealType,
  });
}

/**
 * Sync all meal reminders for a user based on their notification settings
 * Called when settings are updated
 */
export async function syncMealReminders(userId: string): Promise<void> {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    return;
  }

  const timezone = settings.timezone || "UTC";

  // Sync each meal reminder
  const reminders: Array<{ type: ReminderType; time: string | null }> = [
    { type: "breakfast", time: settings.breakfastReminderTime },
    { type: "lunch", time: settings.lunchReminderTime },
    { type: "dinner", time: settings.dinnerReminderTime },
  ];

  for (const { type, time } of reminders) {
    if (time) {
      await scheduleMealReminder(userId, type, time, timezone);
    } else {
      await cancelMealReminder(userId, type);
    }
  }
}

/**
 * Cancel all meal reminders for a user
 * Called when user deletes their account or disables notifications
 */
export async function cancelAllMealReminders(userId: string): Promise<void> {
  const agenda = await getAgenda();

  await agenda.cancel({
    name: "send-meal-reminder",
    "data.userId": userId,
  });
}
