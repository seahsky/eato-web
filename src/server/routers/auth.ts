import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { notifyPartnerLinked, sendCelebrationNotification, sendNudgeNotification } from "@/lib/notifications/triggers";

export const authRouter = router({
  // Generate a partner link code
  generatePartnerCode: protectedProcedure.mutation(async ({ ctx }) => {
    const code = nanoid(6).toUpperCase();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        partnerLinkCode: code,
        partnerLinkCodeExpiry: expiry,
      },
    });

    return { code, expiresAt: expiry };
  }),

  // Link with partner using code
  linkPartner: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.prisma.user.findFirst({
        where: {
          partnerLinkCode: input.code.toUpperCase(),
          partnerLinkCodeExpiry: { gt: new Date() },
        },
      });

      if (!partner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired code",
        });
      }

      if (partner.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot link with yourself",
        });
      }

      if (partner.partnerId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Partner already linked with someone else",
        });
      }

      // Check if current user already has a partner
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { id: true, partnerId: true, name: true },
      });

      if (currentUser?.partnerId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already linked with a partner",
        });
      }

      // Link both users (bidirectional)
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { partnerId: partner.id },
      });

      await ctx.prisma.user.update({
        where: { id: partner.id },
        data: {
          partnerId: ctx.user.id,
          partnerLinkCode: null,
          partnerLinkCodeExpiry: null,
        },
      });

      // Notify both users about successful linking (fire and forget)
      notifyPartnerLinked(partner.id, currentUser?.name || "Your partner").catch(() => {});
      notifyPartnerLinked(ctx.user.id, partner.name || "Your partner").catch(() => {});

      return { success: true, partnerName: partner.name };
    }),

  // Unlink partner
  unlinkPartner: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user?.partnerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No partner linked",
      });
    }

    // Unlink both users
    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { partnerId: null },
    });

    await ctx.prisma.user.update({
      where: { id: user.partnerId },
      data: { partnerId: null },
    });

    return { success: true };
  }),

  // Get current user with partner info
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        profile: true,
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }),

  // Send celebration to partner
  sendCelebration: protectedProcedure
    .input(
      z.object({
        reason: z.enum(["goal_hit", "streak_milestone", "badge_earned", "general"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, partnerId: true },
      });

      if (!user?.partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have a linked partner to send celebrations",
        });
      }

      const sent = await sendCelebrationNotification(
        user.partnerId,
        user.name || "Your partner",
        input.reason
      );

      return { success: true, sent };
    }),

  // Send nudge to partner
  sendNudge: protectedProcedure
    .input(
      z.object({
        type: z.enum(["log_reminder", "goal_motivation", "general"]).default("general"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, partnerId: true },
      });

      if (!user?.partnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have a linked partner to send nudges",
        });
      }

      // Rate limit: 1 nudge per 4 hours - check last nudge sent
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const recentNudge = await ctx.prisma.nudge.findFirst({
        where: {
          fromUserId: ctx.user.id,
          toUserId: user.partnerId,
          createdAt: { gte: fourHoursAgo },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentNudge) {
        const remainingMs = recentNudge.createdAt.getTime() + 4 * 60 * 60 * 1000 - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Please wait ${remainingMinutes} minutes before sending another nudge`,
        });
      }

      // Get nudge message based on type
      const messages: Record<string, string> = {
        log_reminder: "Don't forget to log your meals today!",
        goal_motivation: "You're doing great - keep tracking!",
        general: "Your partner is thinking of you!",
      };

      const message = messages[input.type];

      // Send notification
      const sent = await sendNudgeNotification(
        user.partnerId,
        user.name || "Your partner",
        message
      );

      // Record the nudge
      await ctx.prisma.nudge.create({
        data: {
          fromUserId: ctx.user.id,
          toUserId: user.partnerId,
          message,
        },
      });

      return { success: true, sent };
    }),
});
