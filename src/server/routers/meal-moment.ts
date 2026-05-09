import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendNotificationToUser } from "@/lib/notifications/sender";
import {
  createFoodEntry,
  inferMealTypeFromLabel,
} from "../services/foodLogger";

// Allowed reaction emojis. Keeping this server-side avoids storing arbitrary
// strings while still letting us extend the palette later.
const REACTION_EMOJIS = ["❤️", "🔥", "😋", "👏", "🥲", "😂"] as const;

// Trailing slash prevents subdomain-bypass attacks (same pattern as food.ts).
const R2_PUBLIC_URL_PREFIX = process.env.R2_PUBLIC_URL
  ? process.env.R2_PUBLIC_URL.replace(/\/+$/, "") + "/"
  : null;

const photoUrlSchema = z
  .string()
  .max(2048)
  .refine(
    (url) =>
      !url || (R2_PUBLIC_URL_PREFIX !== null && url.startsWith(R2_PUBLIC_URL_PREFIX)),
    "photoUrl must be an R2 public URL"
  );

// Submitted nutrition payload — identical shape to food.log's body. The
// client computes this via food.analyzePhoto and confirms with the user
// before submitting.
const momentEntryDataSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).nullable().optional(),
  imageUrl: photoUrlSchema.optional(),
  calories: z.number().min(0),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  servingSize: z.number().min(0),
  servingUnit: z.string(),
  mood: z.string().max(10).optional(),
  note: z.string().max(500).optional(),
  isManualEntry: z.boolean().default(false),
  dataSource: z
    .enum(["FATSECRET", "MANUAL", "OPEN_FOOD_FACTS", "USDA"])
    .default("MANUAL"),
  fatSecretId: z.string().optional(),
});

// Verify the moment exists and the caller is a member of its circle.
async function requireMomentMembership(
  prisma: import("@prisma/client").PrismaClient,
  momentId: string,
  userId: string
) {
  const moment = await prisma.mealMoment.findUnique({
    where: { id: momentId },
    include: {
      circle: {
        select: {
          id: true,
          name: true,
          emoji: true,
          showEmptySlots: true,
          members: {
            select: { userId: true, user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  if (!moment) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Moment not found" });
  }
  const isMember = moment.circle.members.some((m) => m.userId === userId);
  if (!isMember) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
  }
  return moment;
}

export const mealMomentRouter = router({
  // Paginated feed of recent meal moments for a circle.
  feed: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/circles/{circleId}/moments" } })
    .input(
      z.object({
        circleId: z.string(),
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .output(z.any())
    .query(async ({ ctx, input }) => {
      // Membership gate.
      const member = await ctx.prisma.circleMember.findUnique({
        where: {
          circleId_userId: { circleId: input.circleId, userId: ctx.user.id },
        },
      });
      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found" });
      }

      const moments = await ctx.prisma.mealMoment.findMany({
        where: { circleId: input.circleId },
        include: {
          entries: {
            include: {
              user: { select: { id: true, name: true } },
              reactions: {
                select: { emoji: true, userId: true },
              },
            },
          },
        },
        orderBy: { firedAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      const hasMore = moments.length > input.limit;
      const sliced = hasMore ? moments.slice(0, input.limit) : moments;

      return {
        items: sliced.map((m) => ({
          id: m.id,
          kind: m.kind,
          label: m.label,
          firedAt: m.firedAt,
          closesAt: m.closesAt,
          gridImageUrl: m.gridImageUrl,
          triggeredByUserId: m.triggeredByUserId,
          entries: m.entries.map((e) => ({
            id: e.id,
            userId: e.userId,
            userName: e.user.name,
            foodEntryId: e.foodEntryId,
            photoUrl: e.photoUrl,
            note: e.note,
            mood: e.mood,
            loggedAtMs: e.loggedAtMs,
            reactions: e.reactions,
          })),
        })),
        nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
      };
    }),

  // Get or lazily-generate the DayCard for a circle on a given local date.
  dayCard: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/circles/{circleId}/day-card" } })
    .input(
      z.object({
        circleId: z.string(),
        // Y-M-D in the circle's local timezone.
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const member = await ctx.prisma.circleMember.findUnique({
        where: {
          circleId_userId: { circleId: input.circleId, userId: ctx.user.id },
        },
      });
      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found" });
      }
      // Stored as midnight UTC of the local date (matches the nightly job).
      const dateStart = new Date(input.date + "T00:00:00.000Z");
      const existing = await ctx.prisma.dayCard.findUnique({
        where: { circleId_date: { circleId: input.circleId, date: dateStart } },
      });
      if (existing) {
        return existing;
      }
      // Lazy generation — caller can refetch after.
      try {
        const { composeDayCard } = await import(
          "../services/momentImageComposer"
        );
        const generated = await composeDayCard(input.circleId, dateStart);
        return generated;
      } catch (err) {
        console.error("dayCard lazy compose failed:", err);
        return null;
      }
    }),

  // Submit a plate photo for a moment. Creates a FoodEntry, atomically
  // increments DailyLog totals, upserts the moment slot, and pushes
  // CIRCLE_MOMENT_LOGGED to other circle members.
  submit: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/moments/{momentId}/submit" } })
    .input(
      z.object({
        momentId: z.string(),
        entry: momentEntryDataSchema,
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const moment = await requireMomentMembership(
        ctx.prisma,
        input.momentId,
        ctx.user.id
      );

      // Today in UTC — keeps the FoodEntry on the day the moment fired
      // (loose consistency with how food.log treats consumedAt).
      const todayYMD = moment.firedAt.toISOString().slice(0, 10);

      const entry = await createFoodEntry({
        userId: ctx.user.id,
        consumedAtDate: todayYMD,
        data: {
          name: input.entry.name,
          brand: input.entry.brand,
          imageUrl: input.entry.imageUrl,
          calories: input.entry.calories,
          protein: input.entry.protein,
          carbs: input.entry.carbs,
          fat: input.entry.fat,
          fiber: input.entry.fiber,
          sugar: input.entry.sugar,
          sodium: input.entry.sodium,
          servingSize: input.entry.servingSize,
          servingUnit: input.entry.servingUnit,
          mealType: inferMealTypeFromLabel(moment.label),
          mood: input.entry.mood,
          note: input.entry.note,
          isManualEntry: input.entry.isManualEntry,
          dataSource: input.entry.dataSource,
          fatSecretId: input.entry.fatSecretId,
        },
      });

      const loggedAtMs = Date.now() - moment.firedAt.getTime();

      // Upsert the moment slot. The slot was pre-created when the moment
      // fired, but we tolerate the case where it wasn't (e.g., a member
      // joined the circle after the moment fired).
      await ctx.prisma.mealMomentEntry.upsert({
        where: {
          momentId_userId: { momentId: moment.id, userId: ctx.user.id },
        },
        update: {
          foodEntryId: entry.id,
          photoUrl: input.entry.imageUrl ?? null,
          note: input.entry.note ?? null,
          mood: input.entry.mood ?? null,
          loggedAtMs,
        },
        create: {
          momentId: moment.id,
          userId: ctx.user.id,
          foodEntryId: entry.id,
          photoUrl: input.entry.imageUrl ?? null,
          note: input.entry.note ?? null,
          mood: input.entry.mood ?? null,
          loggedAtMs,
        },
      });

      // Notify other circle members that someone logged.
      const others = moment.circle.members
        .filter((m) => m.userId !== ctx.user.id)
        .map((m) => m.userId);

      const submitterName = ctx.user.name || "Someone";
      await Promise.all(
        others.map((userId) =>
          sendNotificationToUser(userId, {
            title: `${moment.circle.emoji} ${moment.circle.name}`,
            body: `${submitterName} logged for ${moment.label}`,
            tag: `circle-moment-logged-${moment.id}`,
            url: `eato://circle/${moment.circle.id}/moment/${moment.id}`,
            data: {
              type: "CIRCLE_MOMENT_LOGGED",
              circleId: moment.circle.id,
              momentId: moment.id,
              foodEntryId: entry.id,
            },
          }).catch((err) =>
            console.error(`Notify ${userId} of moment log failed:`, err)
          )
        )
      );

      // Check + unlock circle badges.
      await maybeUnlockCircleBadges(
        ctx.prisma,
        ctx.user.id,
        moment.id,
        moment.circle.id
      );

      return entry;
    }),

  // Toggle an emoji reaction on a moment slot. Callers must be in the
  // same circle as the slot's moment.
  react: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/moments/entries/{entryId}/react" } })
    .input(
      z.object({
        entryId: z.string(),
        emoji: z.enum(REACTION_EMOJIS),
      })
    )
    .output(z.object({ active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.prisma.mealMomentEntry.findUnique({
        where: { id: input.entryId },
        include: {
          moment: {
            select: {
              circleId: true,
              circle: { select: { members: { select: { userId: true } } } },
            },
          },
        },
      });
      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }
      const isMember = slot.moment.circle.members.some(
        (m) => m.userId === ctx.user.id
      );
      if (!isMember) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this circle" });
      }

      // Toggle: remove if exists, create if not.
      const existing = await ctx.prisma.mealMomentReaction.findUnique({
        where: {
          entryId_userId_emoji: {
            entryId: input.entryId,
            userId: ctx.user.id,
            emoji: input.emoji,
          },
        },
      });
      if (existing) {
        await ctx.prisma.mealMomentReaction.delete({
          where: { id: existing.id },
        });
        return { active: false };
      }
      await ctx.prisma.mealMomentReaction.create({
        data: {
          entryId: input.entryId,
          userId: ctx.user.id,
          emoji: input.emoji,
        },
      });
      return { active: true };
    }),
});

// Award circle-related badges. Idempotent — safe to call after every submit.
async function maybeUnlockCircleBadges(
  prisma: import("@prisma/client").PrismaClient,
  userId: string,
  momentId: string,
  circleId: string
): Promise<void> {
  const unlocked = await prisma.achievement.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const has = new Set(unlocked.map((a) => a.badgeId));
  const toUnlock: string[] = [];

  // circle_first_moment — any successful moment submit.
  if (!has.has("circle_first_moment")) {
    toUnlock.push("circle_first_moment");
  }

  // circle_full_house — every member of the moment's circle has logged.
  if (!has.has("circle_full_house")) {
    const moment = await prisma.mealMoment.findUnique({
      where: { id: momentId },
      include: {
        entries: { select: { foodEntryId: true } },
        circle: { select: { members: { select: { userId: true } } } },
      },
    });
    if (moment) {
      const filled = moment.entries.filter((e) => e.foodEntryId).length;
      if (filled >= moment.circle.members.length) {
        toUnlock.push("circle_full_house");
      }
    }
  }

  // circle_seven_day — 7 consecutive moment submits in this circle.
  // Cheap check: count distinct days with at least one submitted slot,
  // among the user's last 7 entries in this circle.
  if (!has.has("circle_seven_day")) {
    const recent = await prisma.mealMomentEntry.findMany({
      where: {
        userId,
        foodEntryId: { not: null },
        moment: { circleId },
      },
      include: { moment: { select: { firedAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const days = new Set<string>();
    for (const e of recent) {
      days.add(e.moment.firedAt.toISOString().slice(0, 10));
    }
    if (days.size >= 7) {
      toUnlock.push("circle_seven_day");
    }
  }

  for (const badgeId of toUnlock) {
    try {
      await prisma.achievement.create({ data: { userId, badgeId } });
    } catch {
      // Duplicate-key — already unlocked.
    }
  }

  if (toUnlock.length > 0) {
    const { BADGES } = await import("@/lib/gamification/badges");
    const { notifyBadgeUnlocked } = await import("@/lib/notifications/triggers");
    const names = toUnlock
      .map((id) => BADGES[id]?.name)
      .filter(Boolean) as string[];
    if (names.length > 0) {
      notifyBadgeUnlocked(userId, names).catch(() => {});
    }
  }
}
