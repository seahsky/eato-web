import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getProductByBarcode, normalizeProduct } from "../services/open-food-facts";
import { getUSDAFoodById, normalizeUSDAProduct } from "../services/usda-food-data";
import { searchFoods } from "../services/food-search";
import { startOfDay, endOfDay } from "date-fns";

const foodEntrySchema = z.object({
  name: z.string().min(1),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  imageUrl: z.string().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  servingSize: z.number().min(0),
  servingUnit: z.string(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  consumedAt: z.string().datetime(),
  isManualEntry: z.boolean().default(false),
  dataSource: z.enum(["OPEN_FOOD_FACTS", "USDA", "MANUAL"]).default("MANUAL"),
  openFoodFactsId: z.string().optional(),
  usdaFdcId: z.number().optional(),
  forPartnerId: z.string().optional(),
});

export const foodRouter = router({
  // Unified search across USDA and Open Food Facts
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      return searchFoods(input.query, input.page);
    }),

  // Get product by barcode (Open Food Facts only)
  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input }) => {
      const product = await getProductByBarcode(input.barcode);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      const normalized = normalizeProduct(product);
      return {
        ...normalized,
        id: `off_${product.code}`,
        dataSource: "OPEN_FOOD_FACTS" as const,
        fdcId: null,
      };
    }),

  // Get USDA food by FDC ID
  getByFdcId: protectedProcedure
    .input(z.object({ fdcId: z.number() }))
    .query(async ({ input }) => {
      const food = await getUSDAFoodById(input.fdcId);
      if (!food) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "USDA food not found",
        });
      }
      return normalizeUSDAProduct(food);
    }),

  // Log food entry
  log: protectedProcedure.input(foodEntrySchema).mutation(async ({ ctx, input }) => {
    const { forPartnerId, ...entryData } = input;
    const isLoggingForPartner = !!forPartnerId;
    let targetUserId = ctx.user.id;

    // Validate partner relationship if logging for partner
    if (isLoggingForPartner) {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { partnerId: true },
      });

      if (user?.partnerId !== forPartnerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only log food for your linked partner",
        });
      }
      targetUserId = forPartnerId;
    }

    const consumedAt = new Date(input.consumedAt);
    const dayStart = startOfDay(consumedAt);

    // Get or create daily log for target user
    let dailyLog = await ctx.prisma.dailyLog.findUnique({
      where: {
        userId_date: {
          userId: targetUserId,
          date: dayStart,
        },
      },
    });

    // Get target user's calorie goal
    const profile = await ctx.prisma.profile.findUnique({
      where: { userId: targetUserId },
    });

    const calorieGoal = profile?.calorieGoal ?? 2000;

    if (!dailyLog) {
      dailyLog = await ctx.prisma.dailyLog.create({
        data: {
          userId: targetUserId,
          date: dayStart,
          calorieGoal,
        },
      });
    }

    // Create food entry
    const entry = await ctx.prisma.foodEntry.create({
      data: {
        userId: targetUserId,
        dailyLogId: dailyLog.id,
        loggedByUserId: isLoggingForPartner ? ctx.user.id : null,
        approvalStatus: isLoggingForPartner ? "PENDING" : "APPROVED",
        ...entryData,
        consumedAt,
      },
    });

    // Only update daily log totals for approved (self-logged) entries
    if (!isLoggingForPartner) {
      await ctx.prisma.dailyLog.update({
        where: { id: dailyLog.id },
        data: {
          totalCalories: { increment: input.calories },
          totalProtein: { increment: input.protein ?? 0 },
          totalCarbs: { increment: input.carbs ?? 0 },
          totalFat: { increment: input.fat ?? 0 },
          totalFiber: { increment: input.fiber ?? 0 },
        },
      });
    }

    return entry;
  }),

  // Get entries for a date
  getByDate: protectedProcedure
    .input(z.object({ date: z.string().datetime() }))
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      const entries = await ctx.prisma.foodEntry.findMany({
        where: {
          userId: ctx.user.id,
          consumedAt: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
        orderBy: { consumedAt: "asc" },
      });

      return entries;
    }),

  // Update entry
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: foodEntrySchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First find the entry without user restriction
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: { id: input.id },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      // Check permissions:
      // - APPROVED entries: only owner can update
      // - PENDING/REJECTED entries: only the logger can update
      const isOwner = entry.userId === ctx.user.id;
      const isLogger = entry.loggedByUserId === ctx.user.id;

      if (entry.approvalStatus === "APPROVED") {
        if (!isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the owner can update approved entries",
          });
        }
      } else {
        // PENDING or REJECTED
        if (!isLogger) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the person who logged this entry can update it",
          });
        }
      }

      // Calculate difference for updating daily log
      const calorieDiff = (input.data.calories ?? entry.calories) - entry.calories;
      const proteinDiff = (input.data.protein ?? entry.protein ?? 0) - (entry.protein ?? 0);
      const carbsDiff = (input.data.carbs ?? entry.carbs ?? 0) - (entry.carbs ?? 0);
      const fatDiff = (input.data.fat ?? entry.fat ?? 0) - (entry.fat ?? 0);
      const fiberDiff = (input.data.fiber ?? entry.fiber ?? 0) - (entry.fiber ?? 0);

      // Remove forPartnerId from update data if present
      const { forPartnerId, ...updateData } = input.data;

      const updated = await ctx.prisma.foodEntry.update({
        where: { id: input.id },
        data: updateData,
      });

      // Only update daily log for APPROVED entries
      if (entry.approvalStatus === "APPROVED" && entry.dailyLogId) {
        await ctx.prisma.dailyLog.update({
          where: { id: entry.dailyLogId },
          data: {
            totalCalories: { increment: calorieDiff },
            totalProtein: { increment: proteinDiff },
            totalCarbs: { increment: carbsDiff },
            totalFat: { increment: fatDiff },
            totalFiber: { increment: fiberDiff },
          },
        });
      }

      return updated;
    }),

  // Delete entry
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First find the entry without user restriction
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: { id: input.id },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found",
        });
      }

      // Check permissions:
      // - APPROVED entries: only owner can delete
      // - PENDING/REJECTED entries: only the logger can delete
      const isOwner = entry.userId === ctx.user.id;
      const isLogger = entry.loggedByUserId === ctx.user.id;

      if (entry.approvalStatus === "APPROVED") {
        if (!isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the owner can delete approved entries",
          });
        }
      } else {
        // PENDING or REJECTED
        if (!isLogger) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the person who logged this entry can delete it",
          });
        }
      }

      // Only update daily log for APPROVED entries (others don't affect totals)
      if (entry.approvalStatus === "APPROVED" && entry.dailyLogId) {
        await ctx.prisma.dailyLog.update({
          where: { id: entry.dailyLogId },
          data: {
            totalCalories: { decrement: entry.calories },
            totalProtein: { decrement: entry.protein ?? 0 },
            totalCarbs: { decrement: entry.carbs ?? 0 },
            totalFat: { decrement: entry.fat ?? 0 },
            totalFiber: { decrement: entry.fiber ?? 0 },
          },
        });
      }

      await ctx.prisma.foodEntry.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get entries pending current user's approval
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.prisma.foodEntry.findMany({
      where: {
        userId: ctx.user.id,
        approvalStatus: "PENDING",
        loggedByUserId: { not: null },
      },
      orderBy: { loggedAt: "desc" },
    });

    // Get logger names
    const loggerIds = [...new Set(entries.map((e) => e.loggedByUserId).filter(Boolean))] as string[];
    const loggers = await ctx.prisma.user.findMany({
      where: { id: { in: loggerIds } },
      select: { id: true, name: true },
    });
    const loggerMap = new Map(loggers.map((l) => [l.id, l.name]));

    return entries.map((e) => ({
      ...e,
      loggedByName: e.loggedByUserId ? loggerMap.get(e.loggedByUserId) : null,
    }));
  }),

  // Get pending approval count (for badge)
  getPendingApprovalCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.foodEntry.count({
      where: {
        userId: ctx.user.id,
        approvalStatus: "PENDING",
        loggedByUserId: { not: null },
      },
    });
    return { count };
  }),

  // Get entries I logged for partner that are pending/rejected
  getMyPendingSubmissions: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.prisma.foodEntry.findMany({
      where: {
        loggedByUserId: ctx.user.id,
        approvalStatus: { in: ["PENDING", "REJECTED"] },
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { loggedAt: "desc" },
    });
    return entries;
  }),

  // Approve an entry
  approveEntry: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: {
          id: input.entryId,
          userId: ctx.user.id,
          approvalStatus: "PENDING",
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found or already processed",
        });
      }

      // Update entry status
      await ctx.prisma.foodEntry.update({
        where: { id: input.entryId },
        data: { approvalStatus: "APPROVED" },
      });

      // Update daily log totals
      if (entry.dailyLogId) {
        await ctx.prisma.dailyLog.update({
          where: { id: entry.dailyLogId },
          data: {
            totalCalories: { increment: entry.calories },
            totalProtein: { increment: entry.protein ?? 0 },
            totalCarbs: { increment: entry.carbs ?? 0 },
            totalFat: { increment: entry.fat ?? 0 },
            totalFiber: { increment: entry.fiber ?? 0 },
          },
        });
      }

      return { success: true };
    }),

  // Reject an entry
  rejectEntry: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: {
          id: input.entryId,
          userId: ctx.user.id,
          approvalStatus: "PENDING",
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found or already processed",
        });
      }

      await ctx.prisma.foodEntry.update({
        where: { id: input.entryId },
        data: {
          approvalStatus: "REJECTED",
          rejectionNote: input.note,
        },
      });

      return { success: true };
    }),

  // Resubmit a rejected entry
  resubmitEntry: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.foodEntry.findFirst({
        where: {
          id: input.entryId,
          loggedByUserId: ctx.user.id,
          approvalStatus: "REJECTED",
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found or not rejected",
        });
      }

      await ctx.prisma.foodEntry.update({
        where: { id: input.entryId },
        data: {
          approvalStatus: "PENDING",
          rejectionNote: null,
        },
      });

      return { success: true };
    }),
});
