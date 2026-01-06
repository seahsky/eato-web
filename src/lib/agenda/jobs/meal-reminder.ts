import type { Agenda, Job } from "agenda";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser, userHasAnySubscription } from "@/lib/notifications";
import type { MealType } from "@prisma/client";

interface MealReminderData {
  userId: string;
  mealType: MealType;
}

const MEAL_MESSAGES: Record<MealType, { title: string; body: string }> = {
  BREAKFAST: {
    title: "Time for breakfast!",
    body: "Don't forget to log your breakfast",
  },
  LUNCH: {
    title: "Lunchtime!",
    body: "Don't forget to log your lunch",
  },
  DINNER: {
    title: "Dinner time!",
    body: "Don't forget to log your dinner",
  },
  SNACK: {
    title: "Snack reminder",
    body: "Don't forget to log your snack",
  },
};

/**
 * Define the meal reminder job
 */
export function defineMealReminderJob(agenda: Agenda): void {
  agenda.define<MealReminderData>(
    "send-meal-reminder",
    async (job: Job<MealReminderData>) => {
      const { userId, mealType } = job.attrs.data;

      try {
        // Check if user still has subscriptions
        const hasSubscription = await userHasAnySubscription(userId);
        if (!hasSubscription) {
          // Cancel future runs if no subscription
          await job.remove();
          return;
        }

        // Check if user has already logged this meal type today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingEntry = await prisma.foodEntry.findFirst({
          where: {
            userId,
            mealType,
            consumedAt: {
              gte: today,
              lt: tomorrow,
            },
            approvalStatus: "APPROVED",
          },
        });

        // Skip notification if meal already logged
        if (existingEntry) {
          return;
        }

        const message = MEAL_MESSAGES[mealType];
        await sendNotificationToUser(userId, {
          title: message.title,
          body: message.body,
          tag: `reminder-${mealType.toLowerCase()}`,
          url: "/search",
          data: {
            type: "meal-reminder",
            mealType,
          },
        });
      } catch (error) {
        console.error(`Failed to send meal reminder for user ${userId}:`, error);
        throw error; // Let Agenda handle retries
      }
    }
  );
}
