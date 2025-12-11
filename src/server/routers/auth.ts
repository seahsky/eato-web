import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { notifyPartnerLinked } from "@/lib/notifications/triggers";

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
});
