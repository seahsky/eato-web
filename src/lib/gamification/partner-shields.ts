import { startOfDay, differenceInCalendarDays, subDays } from "date-fns";
import type { PrismaClient } from "@prisma/client";

export const MAX_SHIELDS_PER_MONTH = 2;
export const SHIELD_LOOKBACK_DAYS = 1; // Can only shield yesterday

export interface ShieldData {
  partnerShields: number;
  shieldsUsedThisMonth: Date[];
  lastShieldReset: Date;
}

export interface ShieldEligibility {
  canUseShield: boolean;
  reason?: string;
  targetDate?: Date;
}

/**
 * Check if shields need monthly reset
 */
export function shouldResetShields(lastResetDate: Date): boolean {
  const now = new Date();
  const lastReset = new Date(lastResetDate);

  return (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  );
}

/**
 * Check if partner is eligible to receive a shield
 */
export function checkShieldEligibility(
  partnerLastLogDate: Date | null,
  partnerCurrentStreak: number,
  shielderHasShields: boolean
): ShieldEligibility {
  if (!shielderHasShields) {
    return {
      canUseShield: false,
      reason: "No shields remaining this month",
    };
  }

  if (!partnerLastLogDate) {
    return {
      canUseShield: false,
      reason: "Partner has no logging history",
    };
  }

  if (partnerCurrentStreak === 0) {
    return {
      canUseShield: false,
      reason: "Partner has no active streak to protect",
    };
  }

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  const lastLog = startOfDay(partnerLastLogDate);
  const daysSinceLog = differenceInCalendarDays(today, lastLog);

  // Partner must have missed exactly 1 day (yesterday)
  if (daysSinceLog !== 2) {
    return {
      canUseShield: false,
      reason:
        daysSinceLog < 2
          ? "Partner logged today or yesterday"
          : "Too many days have passed",
    };
  }

  return {
    canUseShield: true,
    targetDate: yesterday,
  };
}

/**
 * Apply a partner shield
 */
export async function applyPartnerShield(
  prisma: PrismaClient,
  fromUserId: string,
  toUserId: string,
  shieldDate: Date
): Promise<{ success: boolean; newStreak: number }> {
  // Create shield record
  await prisma.partnerShield.create({
    data: {
      fromUserId,
      toUserId,
      shieldedDate: shieldDate,
    },
  });

  // Decrement shield count and track usage
  await prisma.user.update({
    where: { id: fromUserId },
    data: {
      partnerShields: { decrement: 1 },
      shieldsUsedThisMonth: {
        push: new Date(),
      },
    },
  });

  // Partner's streak is preserved - they get credit for the shielded day
  const partner = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { currentStreak: true },
  });

  return {
    success: true,
    newStreak: partner?.currentStreak ?? 0,
  };
}
