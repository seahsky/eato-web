import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendNudgeNotification } from "@/lib/notifications/triggers";

// 4 hours in milliseconds
const NUDGE_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export const notificationRouter = router({
  // Subscribe to push notifications
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert subscription (update if endpoint exists, create if new)
      const subscription = await ctx.prisma.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        update: {
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

  // Unsubscribe from push notifications
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
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
    .input(z.object({ subscriptionId: z.string() }))
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
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.notificationSettings.findUnique({
      where: { userId: ctx.user.id },
    });

    // Return defaults if no settings exist
    if (!settings) {
      return {
        partnerFoodLogged: true,
        partnerGoalReached: true,
        partnerLinked: true,
        receiveNudges: true,
        breakfastReminderTime: null,
        lunchReminderTime: null,
        dinnerReminderTime: null,
      };
    }

    return {
      partnerFoodLogged: settings.partnerFoodLogged,
      partnerGoalReached: settings.partnerGoalReached,
      partnerLinked: settings.partnerLinked,
      receiveNudges: settings.receiveNudges,
      breakfastReminderTime: settings.breakfastReminderTime,
      lunchReminderTime: settings.lunchReminderTime,
      dinnerReminderTime: settings.dinnerReminderTime,
    };
  }),

  // Update notification settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        partnerFoodLogged: z.boolean().optional(),
        partnerGoalReached: z.boolean().optional(),
        partnerLinked: z.boolean().optional(),
        receiveNudges: z.boolean().optional(),
        breakfastReminderTime: z.string().nullable().optional(),
        lunchReminderTime: z.string().nullable().optional(),
        dinnerReminderTime: z.string().nullable().optional(),
      })
    )
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
  getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const subscriptions = await ctx.prisma.pushSubscription.findMany({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return subscriptions;
  }),

  // Send nudge to partner
  sendNudge: protectedProcedure
    .input(
      z.object({
        message: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user with partner info
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: {
          partner: {
            select: { id: true, name: true },
          },
        },
      });

      if (!user?.partner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You don't have a linked partner",
        });
      }

      // Check cooldown - get last nudge sent to this partner
      const lastNudge = await ctx.prisma.nudge.findFirst({
        where: {
          fromUserId: ctx.user.id,
          toUserId: user.partner.id,
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

      // Record the nudge
      await ctx.prisma.nudge.create({
        data: {
          fromUserId: ctx.user.id,
          toUserId: user.partner.id,
          message: input.message,
        },
      });

      // Send the notification
      const sent = await sendNudgeNotification(
        user.partner.id,
        ctx.user.name || "Your partner",
        input.message
      );

      return {
        success: true,
        delivered: sent,
        partnerName: user.partner.name,
      };
    }),

  // Get last nudge sent to partner (for cooldown display)
  getLastNudge: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { partnerId: true },
    });

    if (!user?.partnerId) {
      return null;
    }

    const lastNudge = await ctx.prisma.nudge.findFirst({
      where: {
        fromUserId: ctx.user.id,
        toUserId: user.partnerId,
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
  hasSubscription: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.pushSubscription.count({
      where: { userId: ctx.user.id },
    });
    return count > 0;
  }),
});
