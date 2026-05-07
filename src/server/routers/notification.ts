import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendNudgeNotification } from "@/lib/notifications/triggers";

// 4 hours in milliseconds
const NUDGE_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export const notificationRouter = router({
  // Register an iOS device's APNs token. Matches /notifications/subscribe
  // for web but uses the apnToken + deviceId pair as the identity.
  registerIosDevice: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/notifications/device/ios" } })
    .input(
      z.object({
        apnToken: z.string().min(32),
        deviceId: z.string().min(1),
        appVersion: z.string().optional(),
      })
    )
    .output(z.object({ success: z.boolean(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Upsert by (userId, deviceId). A device can rotate its token and
      // the stable deviceId keeps us from accumulating zombies.
      const existing = await ctx.prisma.pushSubscription.findFirst({
        where: {
          userId: ctx.user.id,
          platform: "ios",
          deviceId: input.deviceId,
        },
      });

      const subscription = existing
        ? await ctx.prisma.pushSubscription.update({
            where: { id: existing.id },
            data: {
              apnToken: input.apnToken,
              appVersion: input.appVersion,
            },
          })
        : await ctx.prisma.pushSubscription.create({
            data: {
              userId: ctx.user.id,
              platform: "ios",
              deviceId: input.deviceId,
              apnToken: input.apnToken,
              appVersion: input.appVersion,
            },
          });

      await ctx.prisma.notificationSettings.upsert({
        where: { userId: ctx.user.id },
        update: {},
        create: { userId: ctx.user.id },
      });

      return { success: true, id: subscription.id };
    }),

  // Unregister an iOS device (sign-out / uninstall).
  unregisterIosDevice: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/notifications/device/ios/remove" } })
    .input(z.object({ deviceId: z.string().min(1) }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pushSubscription.deleteMany({
        where: {
          userId: ctx.user.id,
          platform: "ios",
          deviceId: input.deviceId,
        },
      });
      return { success: true };
    }),

  // Subscribe to web push notifications
  subscribe: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/notifications/subscribe" } })
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
        userAgent: z.string().optional(),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      // Upsert subscription (update if endpoint exists for this user, create if new)
      // Include userId in update to prevent cross-user endpoint hijacking
      const subscription = await ctx.prisma.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        update: {
          userId: ctx.user.id,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent,
        },
        create: {
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent,
        },
      });

      // Create default notification settings if they don't exist
      await ctx.prisma.notificationSettings.upsert({
        where: { userId: ctx.user.id },
        update: {},
        create: {
          userId: ctx.user.id,
        },
      });

      return { success: true, id: subscription.id };
    }),

  // Unsubscribe from web push notifications
  unsubscribe: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/notifications/unsubscribe" } })
    .input(
      z.object({
        endpoint: z.string().url(),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pushSubscription.deleteMany({
        where: {
          userId: ctx.user.id,
          endpoint: input.endpoint,
        },
      });

      return { success: true };
    }),

  // Unsubscribe a specific device by ID
  unsubscribeDevice: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/notifications/device/{subscriptionId}" } })
    .input(z.object({ subscriptionId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.pushSubscription.findFirst({
        where: {
          id: input.subscriptionId,
          userId: ctx.user.id,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      await ctx.prisma.pushSubscription.delete({
        where: { id: input.subscriptionId },
      });

      return { success: true };
    }),

  // Get notification settings
  getSettings: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/notifications/settings" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const settings = await ctx.prisma.notificationSettings.findUnique({
      where: { userId: ctx.user.id },
    });

    // Return defaults if no settings exist
    if (!settings) {
      return {
        friendFoodLogged: true,
        friendGoalReached: true,
        friendAdded: true,
        receiveNudges: true,
        timezone: "UTC",
      };
    }

    return {
      friendFoodLogged: settings.friendFoodLogged,
      friendGoalReached: settings.friendGoalReached,
      friendAdded: settings.friendAdded,
      receiveNudges: settings.receiveNudges,
      timezone: settings.timezone,
    };
  }),

  // Update notification settings
  updateSettings: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/notifications/settings" } })
    .input(
      z.object({
        friendFoodLogged: z.boolean().optional(),
        friendGoalReached: z.boolean().optional(),
        friendAdded: z.boolean().optional(),
        receiveNudges: z.boolean().optional(),
        timezone: z.string().optional(),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.prisma.notificationSettings.upsert({
        where: { userId: ctx.user.id },
        update: input,
        create: {
          userId: ctx.user.id,
          ...input,
        },
      });

      return settings;
    }),

  // Get user's registered devices/subscriptions
  getSubscriptions: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/notifications/subscriptions" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
    const subscriptions = await ctx.prisma.pushSubscription.findMany({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        deviceId: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return subscriptions;
  }),

  // Send nudge to a friend (must be accepted friends).
  sendNudge: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/notifications/nudge" } })
    .input(
      z.object({
        friendId: z.string(),
        message: z.string().max(200).optional(),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const [userAId, userBId] =
        ctx.user.id < input.friendId
          ? [ctx.user.id, input.friendId]
          : [input.friendId, ctx.user.id];

      const friendship = await ctx.prisma.friendship.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });

      if (!friendship || friendship.status !== "ACCEPTED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only nudge accepted friends",
        });
      }

      const friend = await ctx.prisma.user.findUnique({
        where: { id: input.friendId },
        select: { id: true, name: true },
      });

      if (!friend) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend not found",
        });
      }

      // Cooldown check - last nudge from this user to this friend.
      const lastNudge = await ctx.prisma.nudge.findFirst({
        where: {
          fromUserId: ctx.user.id,
          toUserId: friend.id,
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastNudge) {
        const timeSinceLastNudge = Date.now() - lastNudge.createdAt.getTime();
        if (timeSinceLastNudge < NUDGE_COOLDOWN_MS) {
          const remainingMs = NUDGE_COOLDOWN_MS - timeSinceLastNudge;
          const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Please wait ${remainingHours} more hour${remainingHours > 1 ? "s" : ""} before sending another nudge`,
          });
        }
      }

      await ctx.prisma.nudge.create({
        data: {
          fromUserId: ctx.user.id,
          toUserId: friend.id,
          message: input.message,
        },
      });

      const sent = await sendNudgeNotification(
        friend.id,
        ctx.user.name || "A friend",
        input.message
      );

      return {
        success: true,
        delivered: sent,
        friendName: friend.name,
      };
    }),

  // Get last nudge sent to a specific friend (for cooldown display).
  getLastNudge: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/notifications/nudge/last" } })
    .input(z.object({ friendId: z.string() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const lastNudge = await ctx.prisma.nudge.findFirst({
        where: {
          fromUserId: ctx.user.id,
          toUserId: input.friendId,
        },
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          message: true,
        },
      });

      if (!lastNudge) {
        return null;
      }

      const timeSinceLastNudge = Date.now() - lastNudge.createdAt.getTime();
      const canSendNudge = timeSinceLastNudge >= NUDGE_COOLDOWN_MS;
      const cooldownRemainingMs = canSendNudge
        ? 0
        : NUDGE_COOLDOWN_MS - timeSinceLastNudge;

      return {
        sentAt: lastNudge.createdAt,
        canSendNudge,
        cooldownRemainingMs,
      };
    }),

  // Check if user has any push subscriptions
  hasSubscription: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/notifications/has-subscription" } })
    .input(z.void())
    .output(z.boolean())
    .query(async ({ ctx }) => {
    const count = await ctx.prisma.pushSubscription.count({
      where: { userId: ctx.user.id },
    });
    return count > 0;
  }),
});
