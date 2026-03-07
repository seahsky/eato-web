import { getAgenda } from "./index";

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
