import { sendNotificationToUser, isNotificationEnabled, userHasAnySubscription } from "./sender";
import type { MealType } from "@prisma/client";

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: "breakfast",
  LUNCH: "lunch",
  DINNER: "dinner",
  SNACK: "a snack",
};

/**
 * Notify partner that they have a pending approval for food logged by user
 */
export async function notifyPendingApproval(
  partnerId: string,
  loggerName: string,
  entry: {
    id: string;
    name: string;
    calories: number;
    mealType: MealType;
  }
): Promise<void> {
  const hasSubscription = await userHasAnySubscription(partnerId);
  if (!hasSubscription) return;

  const isEnabled = await isNotificationEnabled(partnerId, "partnerFoodLogged");
  if (!isEnabled) return;

  await sendNotificationToUser(partnerId, {
    title: `${loggerName} logged food for you`,
    body: `${entry.name} (${entry.calories} kcal) - Tap to review`,
    tag: "pending-approval",
    url: "/partner?tab=approvals",
    data: {
      type: "pending-approval",
      entryId: entry.id,
      entryName: entry.name,
      calories: entry.calories,
      mealType: entry.mealType,
      loggerName,
    },
  });
}

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
  const hasSubscription = await userHasAnySubscription(partnerId);
  if (!hasSubscription) return;

  const isEnabled = await isNotificationEnabled(partnerId, "partnerFoodLogged");
  if (!isEnabled) return;

  await sendNotificationToUser(partnerId, {
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
  const hasSubscription = await userHasAnySubscription(partnerId);
  if (!hasSubscription) return;

  const isEnabled = await isNotificationEnabled(partnerId, "partnerGoalReached");
  if (!isEnabled) return;

  await sendNotificationToUser(partnerId, {
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
  const hasSubscription = await userHasAnySubscription(userId);
  if (!hasSubscription) return;

  const isEnabled = await isNotificationEnabled(userId, "partnerLinked");
  if (!isEnabled) return;

  await sendNotificationToUser(userId, {
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
  const hasSubscription = await userHasAnySubscription(toUserId);
  if (!hasSubscription) return false;

  const isEnabled = await isNotificationEnabled(toUserId, "receiveNudges");
  if (!isEnabled) return false;

  const result = await sendNotificationToUser(toUserId, {
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
  const hasSubscription = await userHasAnySubscription(userId);
  if (!hasSubscription) return;

  const mealLabel = MEAL_TYPE_LABELS[mealType];

  await sendNotificationToUser(userId, {
    title: `Time for ${mealLabel}!`,
    body: `Don't forget to log your ${mealLabel}`,
    tag: `reminder-${mealType.toLowerCase()}`,
    url: "/search",
  });
}

/**
 * Send celebration notification to partner
 */
export async function sendCelebrationNotification(
  toUserId: string,
  fromUserName: string,
  reason: "goal_hit" | "streak_milestone" | "badge_earned" | "general"
): Promise<boolean> {
  const hasSubscription = await userHasAnySubscription(toUserId);
  if (!hasSubscription) return false;

  const isEnabled = await isNotificationEnabled(toUserId, "receiveNudges");
  if (!isEnabled) return false;

  const messages: Record<typeof reason, { title: string; body: string }> = {
    goal_hit: {
      title: `🎉 ${fromUserName} is celebrating you!`,
      body: "Congrats on hitting your daily goal!",
    },
    streak_milestone: {
      title: `🔥 ${fromUserName} is celebrating you!`,
      body: "Amazing streak! Keep it up!",
    },
    badge_earned: {
      title: `🏆 ${fromUserName} is celebrating you!`,
      body: "Awesome achievement unlocked!",
    },
    general: {
      title: `🎊 ${fromUserName} sent you a celebration!`,
      body: "Your partner is proud of you!",
    },
  };

  const message = messages[reason];

  const result = await sendNotificationToUser(toUserId, {
    title: message.title,
    body: message.body,
    tag: "celebration",
    url: "/partner",
  });

  return result.sent > 0;
}

/**
 * Notify user when they unlock new badges
 */
export async function notifyBadgeUnlocked(
  userId: string,
  badgeNames: string[]
): Promise<void> {
  const hasSubscription = await userHasAnySubscription(userId);
  if (!hasSubscription) return;

  const count = badgeNames.length;
  await sendNotificationToUser(userId, {
    title: `🏆 New Badge${count > 1 ? "s" : ""} Unlocked!`,
    body: badgeNames.join(", "),
    tag: "badge-unlocked",
    url: "/profile?tab=badges",
    data: { type: "badge_unlocked", badges: badgeNames },
  });
}

/**
 * Notify food logger when their entry is approved or rejected
 */
export async function notifyApprovalResult(
  loggerId: string,
  approverName: string,
  foodName: string,
  approved: boolean
): Promise<void> {
  const hasSubscription = await userHasAnySubscription(loggerId);
  if (!hasSubscription) return;

  await sendNotificationToUser(loggerId, {
    title: approved ? "✅ Entry Approved" : "❌ Entry Rejected",
    body: `${approverName} ${approved ? "approved" : "rejected"} your ${foodName} entry`,
    tag: "approval-result",
    url: "/dashboard",
    data: { type: "approval_result", approved },
  });
}
