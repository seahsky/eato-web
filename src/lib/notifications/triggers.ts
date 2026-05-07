import { sendNotificationToUser, isNotificationEnabled, userHasAnySubscription } from "./sender";

/**
 * Send a nudge notification to a friend.
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
 * Notify user when they unlock new badges.
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
