import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

// Friend code lifetime (24h, matches the old partner code semantics).
const FRIEND_CODE_TTL_MS = 24 * 60 * 60 * 1000;

// Order a pair of user IDs deterministically so we can hold a single
// Friendship row per pair via @@unique([userAId, userBId]).
function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

const friendCodeOutputSchema = z.object({
  code: z.string(),
  expiresAt: z.date(),
});

const acceptFriendCodeOutputSchema = z.object({
  success: z.boolean(),
  friendName: z.string().nullable(),
});

const removeFriendOutputSchema = z.object({
  success: z.boolean(),
});

const friendListOutputSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    friendedAt: z.date(),
  })
);

const friendFeedItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string().nullable(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  calories: z.number(),
  mealType: z.string().nullable(),
  mood: z.string().nullable(),
  note: z.string().nullable(),
  consumedAt: z.date(),
});

const friendFeedOutputSchema = z.object({
  items: z.array(friendFeedItemSchema),
  nextCursor: z.string().nullable(),
});

export const friendRouter = router({
  // Generate a personal friend code that another user can redeem.
  // Replaces an existing code for the same user (one active code per user).
  generateFriendCode: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/friends/code" } })
    .input(z.void())
    .output(friendCodeOutputSchema)
    .mutation(async ({ ctx }) => {
      const code = nanoid(6).toUpperCase();
      const expiresAt = new Date(Date.now() + FRIEND_CODE_TTL_MS);

      // Replace any existing code so each user has at most one active code.
      await ctx.prisma.$transaction([
        ctx.prisma.friendCode.deleteMany({
          where: { userId: ctx.user.id },
        }),
        ctx.prisma.friendCode.create({
          data: {
            userId: ctx.user.id,
            code,
            expiresAt,
          },
        }),
      ]);

      return { code, expiresAt };
    }),

  // Redeem someone else's friend code. Creates an ACCEPTED friendship row.
  acceptFriendCode: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/friends/accept" } })
    .input(z.object({ code: z.string().length(6) }))
    .output(acceptFriendCodeOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const friendCode = await ctx.prisma.friendCode.findUnique({
        where: { code: input.code.toUpperCase() },
        include: { user: { select: { id: true, name: true } } },
      });

      if (!friendCode || friendCode.expiresAt < new Date()) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired code",
        });
      }

      if (friendCode.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot friend yourself",
        });
      }

      const [userAId, userBId] = orderedPair(ctx.user.id, friendCode.userId);

      // Idempotent — if the friendship already exists, just succeed.
      await ctx.prisma.friendship.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        update: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
        create: {
          userAId,
          userBId,
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      // Burn the code so it can't be re-used.
      await ctx.prisma.friendCode.deleteMany({
        where: { code: friendCode.code },
      });

      return { success: true, friendName: friendCode.user.name };
    }),

  // Remove a friend (deletes the Friendship row regardless of status).
  removeFriend: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/friends/remove" } })
    .input(z.object({ friendId: z.string() }))
    .output(removeFriendOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const [userAId, userBId] = orderedPair(ctx.user.id, input.friendId);

      const result = await ctx.prisma.friendship.deleteMany({
        where: { userAId, userBId },
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friendship not found",
        });
      }

      return { success: true };
    }),

  // List the current user's accepted friends.
  listFriends: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/friends" } })
    .input(z.void())
    .output(friendListOutputSchema)
    .query(async ({ ctx }) => {
      const friendships = await ctx.prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ userAId: ctx.user.id }, { userBId: ctx.user.id }],
        },
        include: {
          userA: { select: { id: true, name: true, email: true } },
          userB: { select: { id: true, name: true, email: true } },
        },
        orderBy: { acceptedAt: "desc" },
      });

      return friendships.map((f) => {
        const friend = f.userAId === ctx.user.id ? f.userB : f.userA;
        return {
          id: friend.id,
          name: friend.name,
          email: friend.email,
          friendedAt: f.acceptedAt ?? f.createdAt,
        };
      });
    }),

  // Paginated feed of recent meals from accepted friends.
  // Cursor is the FoodEntry id; we order by consumedAt desc.
  friendFeed: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/friends/feed" } })
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .output(friendFeedOutputSchema)
    .query(async ({ ctx, input }) => {
      // Resolve friend IDs from accepted friendships.
      const friendships = await ctx.prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ userAId: ctx.user.id }, { userBId: ctx.user.id }],
        },
        select: { userAId: true, userBId: true },
      });

      const friendIds = friendships.map((f) =>
        f.userAId === ctx.user.id ? f.userBId : f.userAId
      );

      if (friendIds.length === 0) {
        return { items: [], nextCursor: null };
      }

      const entries = await ctx.prisma.foodEntry.findMany({
        where: { userId: { in: friendIds } },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { consumedAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
      });

      const hasMore = entries.length > input.limit;
      const sliced = hasMore ? entries.slice(0, input.limit) : entries;

      return {
        items: sliced.map((e) => ({
          id: e.id,
          userId: e.userId,
          userName: e.user.name,
          name: e.name,
          imageUrl: e.imageUrl,
          calories: e.calories,
          mealType: e.mealType,
          mood: e.mood,
          note: e.note,
          consumedAt: e.consumedAt,
        })),
        nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
      };
    }),
});
