import { router, protectedProcedure } from "../trpc";
import {
  BADGES,
  getBadgesByCategory,
  getTotalBadgeCount,
  getAvatarFrame,
  getUnlockedThemes,
  AVATAR_FRAME_THRESHOLDS,
  THEME_UNLOCK_THRESHOLDS,
  type BadgeCategory,
  type AvatarFrame,
  type ThemeId,
} from "@/lib/gamification/badges";

import { z } from "zod";

export const achievementsRouter = router({
  // Get all user achievements with badge details
  getAll: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/achievements" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const achievements = await ctx.prisma.achievement.findMany({
      where: { userId: ctx.user.id },
      orderBy: { unlockedAt: "desc" },
    });

    const unlockedBadgeIds = new Set(achievements.map((a) => a.badgeId));

    // Get user data for theme/avatar frame unlocks
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        longestStreak: true,
        unlockedTheme: true,
        avatarFrame: true,
      },
    });

    // Map to badge details
    const unlockedBadges = achievements
      .filter((a) => BADGES[a.badgeId])
      .map((a) => ({
        ...BADGES[a.badgeId],
        unlockedAt: a.unlockedAt,
      }));

    // Get all badges with unlock status
    const allBadges = Object.values(BADGES).map((badge) => ({
      ...badge,
      unlocked: unlockedBadgeIds.has(badge.id),
      unlockedAt: achievements.find((a) => a.badgeId === badge.id)?.unlockedAt,
    }));

    return {
      unlockedBadges,
      allBadges,
      totalBadges: getTotalBadgeCount(),
      unlockedCount: unlockedBadges.length,
      avatarFrame: getAvatarFrame(unlockedBadges.length),
      currentAvatarFrame: user?.avatarFrame ?? "none",
      unlockedThemes: getUnlockedThemes(user?.longestStreak ?? 0),
      currentTheme: user?.unlockedTheme ?? "default",
    };
  }),

  // Get badges by category
  getByCategory: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/achievements/by-category" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const achievements = await ctx.prisma.achievement.findMany({
      where: { userId: ctx.user.id },
    });

    const unlockedBadgeIds = new Set(achievements.map((a) => a.badgeId));

    const categories: BadgeCategory[] = ["consistency", "logging", "goals", "partner"];
    const result: Record<BadgeCategory, Array<typeof BADGES[string] & { unlocked: boolean }>> = {
      consistency: [],
      logging: [],
      goals: [],
      partner: [],
    };

    for (const category of categories) {
      const badges = getBadgesByCategory(category);
      result[category] = badges.map((badge) => ({
        ...badge,
        unlocked: unlockedBadgeIds.has(badge.id),
      }));
    }

    return result;
  }),

  // Get recent achievements (for notifications/toasts)
  getRecent: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/achievements/recent" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentAchievements = await ctx.prisma.achievement.findMany({
      where: {
        userId: ctx.user.id,
        unlockedAt: { gte: oneDayAgo },
      },
      orderBy: { unlockedAt: "desc" },
      take: 5,
    });

    return recentAchievements
      .filter((a) => BADGES[a.badgeId])
      .map((a) => ({
        ...BADGES[a.badgeId],
        unlockedAt: a.unlockedAt,
      }));
  }),

  // Get achievement summary (for profile display)
  getSummary: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/achievements/summary" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const [achievementCount, user] = await Promise.all([
      ctx.prisma.achievement.count({
        where: { userId: ctx.user.id },
      }),
      ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          currentStreak: true,
          longestStreak: true,
          avatarFrame: true,
        },
      }),
    ]);

    return {
      badgeCount: achievementCount,
      totalBadges: getTotalBadgeCount(),
      avatarFrame: getAvatarFrame(achievementCount),
      currentAvatarFrame: user?.avatarFrame ?? "none",
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
    };
  }),

  // Get partner's achievements for joint badge view
  getPartnerAchievements: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/achievements/partner" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    // Get current user to find partner
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { partnerId: true },
    });

    if (!user?.partnerId) {
      return null;
    }

    // Get partner info
    const partner = await ctx.prisma.user.findUnique({
      where: { id: user.partnerId },
      select: { name: true },
    });

    // Get partner's achievements
    const partnerAchievements = await ctx.prisma.achievement.findMany({
      where: { userId: user.partnerId },
      orderBy: { unlockedAt: "desc" },
    });

    // Get user's achievements for comparison
    const userAchievements = await ctx.prisma.achievement.findMany({
      where: { userId: ctx.user.id },
      orderBy: { unlockedAt: "desc" },
    });

    // Calculate shared count
    const userBadgeIds = new Set(userAchievements.map((a) => a.badgeId));
    const partnerBadgeIds = new Set(partnerAchievements.map((a) => a.badgeId));
    const sharedCount = [...userBadgeIds].filter((id) => partnerBadgeIds.has(id)).length;

    return {
      partnerName: partner?.name ?? "Partner",
      userAchievements: userAchievements.map((a) => ({
        badgeId: a.badgeId,
        unlockedAt: a.unlockedAt,
      })),
      partnerAchievements: partnerAchievements.map((a) => ({
        badgeId: a.badgeId,
        unlockedAt: a.unlockedAt,
      })),
      userCount: userAchievements.length,
      partnerCount: partnerAchievements.length,
      sharedCount,
    };
  }),

  // Update user's selected theme
  updateTheme: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/achievements/theme" } })
    .input(z.object({ theme: z.string() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { theme } = input;

      // Validate theme exists
      if (!(theme in THEME_UNLOCK_THRESHOLDS)) {
        throw new Error(`Invalid theme: ${theme}`);
      }

      // Get user's longest streak to check if theme is unlocked
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { longestStreak: true },
      });

      const requiredStreak = THEME_UNLOCK_THRESHOLDS[theme as ThemeId];
      if ((user?.longestStreak ?? 0) < requiredStreak) {
        throw new Error(`Theme "${theme}" requires a ${requiredStreak}-day streak to unlock`);
      }

      // Update theme
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { unlockedTheme: theme },
      });

      return { success: true, theme };
    }),

  // Update user's selected avatar frame
  updateAvatarFrame: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/achievements/avatar-frame" } })
    .input(z.object({ avatarFrame: z.string() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { avatarFrame } = input;

      // Validate frame exists
      if (!(avatarFrame in AVATAR_FRAME_THRESHOLDS)) {
        throw new Error(`Invalid avatar frame: ${avatarFrame}`);
      }

      // Get user's badge count to check if frame is unlocked
      const badgeCount = await ctx.prisma.achievement.count({
        where: { userId: ctx.user.id },
      });

      const requiredBadges = AVATAR_FRAME_THRESHOLDS[avatarFrame as AvatarFrame];
      if (badgeCount < requiredBadges) {
        throw new Error(`Avatar frame "${avatarFrame}" requires ${requiredBadges} badges to unlock`);
      }

      // Update avatar frame
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { avatarFrame },
      });

      return { success: true, avatarFrame };
    }),
});
