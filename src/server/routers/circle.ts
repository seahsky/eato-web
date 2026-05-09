import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const MAX_CIRCLE_MEMBERS = 8;
// Ad-hoc moment cooldown: 1/hour/circle/user.
const ADHOC_MOMENT_COOLDOWN_MS = 60 * 60 * 1000;

// Order a pair of user IDs for the Friendship @@unique([userAId, userBId]).
function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// Verify the caller is a member of the circle and return the circle row
// with members. Throws FORBIDDEN if not a member, NOT_FOUND if missing.
async function requireCircleMembership(
  prisma: import("@prisma/client").PrismaClient,
  circleId: string,
  userId: string
) {
  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      schedules: { where: { enabled: true } },
    },
  });
  if (!circle) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found" });
  }
  const me = circle.members.find((m) => m.userId === userId);
  if (!me) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
  }
  return { circle, me };
}

// Validate "HH:MM" 24-hour local time string.
const localTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "localTime must be HH:MM (24h)");

const scheduleInputSchema = z.object({
  label: z.string().min(1).max(40),
  localTime: localTimeSchema,
  // 1..127 bitmask (bit 0 = Sun ... bit 6 = Sat). 0 disables every day.
  daysOfWeek: z.number().int().min(0).max(127).default(127),
});

export const circleRouter = router({
  // Create a circle. The caller becomes the OWNER and first member.
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/circles" } })
    .input(
      z.object({
        name: z.string().min(1).max(40),
        emoji: z.string().max(8).default("🍽️"),
        timezone: z.string().min(1).max(64).default("UTC"),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const circle = await ctx.prisma.circle.create({
        data: {
          name: input.name,
          emoji: input.emoji,
          timezone: input.timezone,
          createdById: ctx.user.id,
          members: {
            create: { userId: ctx.user.id, role: "OWNER" },
          },
        },
        include: { members: true },
      });
      return circle;
    }),

  // List all circles the caller is in.
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/circles" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      const memberships = await ctx.prisma.circleMember.findMany({
        where: { userId: ctx.user.id },
        include: {
          circle: {
            include: {
              members: { select: { userId: true, role: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });
      return memberships.map((m) => ({
        id: m.circle.id,
        name: m.circle.name,
        emoji: m.circle.emoji,
        timezone: m.circle.timezone,
        memberCount: m.circle.members.length,
        role: m.role,
        joinedAt: m.joinedAt,
      }));
    }),

  // Get a single circle with members + active schedules.
  // Caller must be a member.
  get: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/circles/{circleId}" } })
    .input(z.object({ circleId: z.string() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const { circle, me } = await requireCircleMembership(
        ctx.prisma,
        input.circleId,
        ctx.user.id
      );
      return {
        id: circle.id,
        name: circle.name,
        emoji: circle.emoji,
        timezone: circle.timezone,
        mealMomentWindowMinutes: circle.mealMomentWindowMinutes,
        showEmptySlots: circle.showEmptySlots,
        createdAt: circle.createdAt,
        myRole: me.role,
        members: circle.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          name: m.user.name,
          email: m.user.email,
        })),
        schedules: circle.schedules.map((s) => ({
          id: s.id,
          label: s.label,
          localTime: s.localTime,
          daysOfWeek: s.daysOfWeek,
          enabled: s.enabled,
        })),
      };
    }),

  // Invite a friend into the circle. Inviter must be a member; invitee
  // must already be an ACCEPTED friend of the inviter.
  invite: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/circles/{circleId}/invite" } })
    .input(
      z.object({
        circleId: z.string(),
        friendUserId: z.string(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { circle } = await requireCircleMembership(
        ctx.prisma,
        input.circleId,
        ctx.user.id
      );

      if (input.friendUserId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot invite yourself",
        });
      }

      if (circle.members.length >= MAX_CIRCLE_MEMBERS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Circles are capped at ${MAX_CIRCLE_MEMBERS} members`,
        });
      }

      // Enforce friendship: inviter and invitee must be ACCEPTED friends.
      const [userAId, userBId] = orderedPair(ctx.user.id, input.friendUserId);
      const friendship = await ctx.prisma.friendship.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (!friendship || friendship.status !== "ACCEPTED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only invite accepted friends to a circle",
        });
      }

      // Idempotent: if the user is already a member, succeed.
      try {
        await ctx.prisma.circleMember.create({
          data: {
            circleId: circle.id,
            userId: input.friendUserId,
            role: "MEMBER",
          },
        });
      } catch (err) {
        // Unique-constraint violation = already a member.
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code === "P2002"
        ) {
          return { success: true };
        }
        throw err;
      }

      return { success: true };
    }),

  // Owner-only: remove a member from the circle.
  kick: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/circles/{circleId}/kick" } })
    .input(
      z.object({
        circleId: z.string(),
        userId: z.string(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { me } = await requireCircleMembership(
        ctx.prisma,
        input.circleId,
        ctx.user.id
      );

      if (me.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the circle owner can remove members",
        });
      }

      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Owners cannot kick themselves; use leave or delete",
        });
      }

      const target = await ctx.prisma.circleMember.findUnique({
        where: {
          circleId_userId: {
            circleId: input.circleId,
            userId: input.userId,
          },
        },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      await ctx.prisma.circleMember.delete({ where: { id: target.id } });
      return { success: true };
    }),

  // Leave the circle. If caller is the last member, the circle is deleted.
  // Owners cannot leave unless they're alone — they must hand off or delete.
  leave: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/circles/{circleId}/leave" } })
    .input(z.object({ circleId: z.string() }))
    .output(z.object({ success: z.boolean(), deleted: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { circle, me } = await requireCircleMembership(
        ctx.prisma,
        input.circleId,
        ctx.user.id
      );

      const isLastMember = circle.members.length === 1;

      if (me.role === "OWNER" && !isLastMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Owners must hand off ownership or delete the circle before leaving",
        });
      }

      await ctx.prisma.circleMember.delete({ where: { id: me.id } });

      if (isLastMember) {
        // Cascade deletes schedules, moments, day cards, etc.
        await ctx.prisma.circle.delete({ where: { id: circle.id } });
        return { success: true, deleted: true };
      }

      return { success: true, deleted: false };
    }),

  // Owner-only: delete the circle (cascades members/schedules/moments).
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/circles/{circleId}" } })
    .input(z.object({ circleId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { me } = await requireCircleMembership(
        ctx.prisma,
        input.circleId,
        ctx.user.id
      );

      if (me.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the circle owner can delete the circle",
        });
      }

      await ctx.prisma.circle.delete({ where: { id: input.circleId } });
      return { success: true };
    }),

  // Owner-only: replace the schedule list with the new one. The Agenda
  // scheduler reads this fresh on its daily reschedule pass, so we just
  // need to update the rows here.
  setSchedule: protectedProcedure
    .meta({ openapi: { method: "PUT", path: "/circles/{circleId}/schedule" } })
    .input(
      z.object({
        circleId: z.string(),
        schedules: z.array(scheduleInputSchema).max(8),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { me } = await requireCircleMembership(
        ctx.prisma,
        input.circleId,
        ctx.user.id
      );

      if (me.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the circle owner can edit the schedule",
        });
      }

      // Replace-all — simplest semantics for a small list.
      await ctx.prisma.$transaction([
        ctx.prisma.circleSchedule.deleteMany({
          where: { circleId: input.circleId },
        }),
        ...input.schedules.map((s) =>
          ctx.prisma.circleSchedule.create({
            data: {
              circleId: input.circleId,
              label: s.label,
              localTime: s.localTime,
              daysOfWeek: s.daysOfWeek,
            },
          })
        ),
      ]);

      const fresh = await ctx.prisma.circleSchedule.findMany({
        where: { circleId: input.circleId },
        orderBy: { localTime: "asc" },
      });
      return fresh;
    }),

  // Owner: update window/showEmptySlots/timezone/name/emoji.
  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/circles/{circleId}" } })
    .input(
      z.object({
        circleId: z.string(),
        name: z.string().min(1).max(40).optional(),
        emoji: z.string().max(8).optional(),
        timezone: z.string().min(1).max(64).optional(),
        mealMomentWindowMinutes: z.number().int().min(5).max(180).optional(),
        showEmptySlots: z.boolean().optional(),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { me } = await requireCircleMembership(
        ctx.prisma,
        input.circleId,
        ctx.user.id
      );
      if (me.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the circle owner can update settings",
        });
      }
      const { circleId, ...rest } = input;
      const updated = await ctx.prisma.circle.update({
        where: { id: circleId },
        data: rest,
      });
      return updated;
    }),

  // Ad-hoc "I'm eating" call. Creates a MealMoment(kind=ADHOC), pre-creates
  // empty entries for all members, and pushes CIRCLE_MOMENT_FIRED. Rate-
  // limited to 1/hour/circle/user (mirrors the Nudge cooldown pattern).
  callMoment: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/circles/{circleId}/call" } })
    .input(
      z.object({
        circleId: z.string(),
        label: z.string().min(1).max(40).optional(),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { circle } = await requireCircleMembership(
        ctx.prisma,
        input.circleId,
        ctx.user.id
      );

      // Cooldown check: any moment this user triggered in this circle in the
      // last hour blocks a new call.
      const cooldownStart = new Date(Date.now() - ADHOC_MOMENT_COOLDOWN_MS);
      const recentCall = await ctx.prisma.mealMoment.findFirst({
        where: {
          circleId: circle.id,
          kind: "ADHOC",
          triggeredByUserId: ctx.user.id,
          firedAt: { gte: cooldownStart },
        },
        orderBy: { firedAt: "desc" },
      });
      if (recentCall) {
        const remainingMs =
          ADHOC_MOMENT_COOLDOWN_MS -
          (Date.now() - recentCall.firedAt.getTime());
        const remainingMin = Math.max(1, Math.ceil(remainingMs / 60000));
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Please wait ${remainingMin} more minute${remainingMin > 1 ? "s" : ""} before calling another moment`,
        });
      }

      // Inline pipeline (no scheduler needed for ad-hoc).
      const { fireMealMoment } = await import("../services/circleScheduler");
      const moment = await fireMealMoment({
        circleId: circle.id,
        kind: "ADHOC",
        label: input.label ?? "Eating now",
        triggeredByUserId: ctx.user.id,
      });

      return moment;
    }),
});
