import { sendPushNotification, isNotificationEnabled, userHasPushSubscription } from "./web-push";
import type { MealType } from "@prisma/client";

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: "breakfast",
  LUNCH: "lunch",
  DINNER: "dinner",
  SNACK: "a snack",
};

/**
 * Notify partner that user logged food
 */
export async function notifyPartnerFoodLogged(
  partnerId: string,
  loggerName: string,
  foodName: string,
  mealType: MealType
): Promise<void> {
  // Check if partner has subscriptions and notifications enabled
  const hasSubscription = await userHasPushSubscription(partnerId);
  if (!hasSubscription) return;

  const isEnabled = await isNotificationEnabled(partnerId, "partnerFoodLogged");
  if (!isEnabled) return;

  await sendPushNotification(partnerId, {
    title: `${loggerName} logged ${MEAL_TYPE_LABELS[mealType]}`,
    body: foodName,
    tag: "partner-food-logged",
    url: "/partner",
  });
}

/**
 * Notify partner when user reaches their daily calorie goal
 */
export async function notifyPartnerGoalReached(
  partnerId: string,
  userName: string
): Promise<void> {
  const hasSubscription = await userHasPushSubscription(partnerId);
  if (!hasSubscription) return;

  const isEnabled = await isNotificationEnabled(partnerId, "partnerGoalReached");
  if (!isEnabled) return;

  await sendPushNotification(partnerId, {
    title: "Goal reached!",
    body: `${userName} hit their calorie target for today`,
    tag: "partner-goal-reached",
    url: "/partner",
  });
}

/**
 * Notify user that a partner has been linked to their account
 */
export async function notifyPartnerLinked(
  userId: string,
  partnerName: string
): Promise<void> {
  const hasSubscription = await userHasPushSubscription(userId);
  if (!hasSubscription) return;

  const isEnabled = await isNotificationEnabled(userId, "partnerLinked");
  if (!isEnabled) return;

  await sendPushNotification(userId, {
    title: "Partner linked!",
    body: `You're now connected with ${partnerName}`,
    tag: "partner-linked",
    url: "/partner",
  });
}

/**
 * Send a nudge notification to partner
 */
export async function sendNudgeNotification(
  toUserId: string,
  fromUserName: string,
  message?: string
): Promise<boolean> {
  const hasSubscription = await userHasPushSubscription(toUserId);
  if (!hasSubscription) return false;

  const isEnabled = await isNotificationEnabled(toUserId, "receiveNudges");
  if (!isEnabled) return false;

  const result = await sendPushNotification(toUserId, {
    title: `Nudge from ${fromUserName}`,
    body: message || "Don't forget to log your meals today!",
    tag: "nudge",
    url: "/dashboard",
  });

  return result.sent > 0;
}

/**
 * Send meal reminder notification
 */
export async function sendMealReminder(
  userId: string,
  mealType: MealType
): Promise<void> {
  const hasSubscription = await userHasPushSubscription(userId);
  if (!hasSubscription) return;

  const mealLabel = MEAL_TYPE_LABELS[mealType];

  await sendPushNotification(userId, {
    title: `Time for ${mealLabel}!`,
    body: `Don't forget to log your ${mealLabel}`,
    tag: `reminder-${mealType.toLowerCase()}`,
    url: "/search",
  });
}
