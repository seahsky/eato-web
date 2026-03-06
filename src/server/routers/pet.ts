import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { subDays } from "date-fns"
import { getPetHealthState, countDaysOnGoal } from "@/lib/pet/health"

// 30 minutes cooldown for pet interactions
const PET_INTERACTION_COOLDOWN_MS = 30 * 60 * 1000

export const petRouter = router({
  // Get current user's pet health state
  getHealth: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/pet/health" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      const now = new Date()
      const sevenDaysAgo = subDays(now, 7)

      const dailyLogs = await ctx.prisma.dailyLog.findMany({
        where: {
          userId: ctx.user.id,
          date: { gte: sevenDaysAgo },
        },
        select: { goalMet: true, date: true },
        orderBy: { date: "desc" },
        take: 7,
      })

      const daysOnGoal = countDaysOnGoal(dailyLogs)
      const healthState = getPetHealthState(daysOnGoal)

      return {
        daysOnGoal,
        healthState,
        recentDays: dailyLogs.map(log => ({
          date: log.date,
          goalMet: log.goalMet,
        })),
      }
    }),

  // Get partner's pet health state
  getPartnerHealth: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/pet/partner-health" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      if (!ctx.user.partnerId) {
        return null
      }

      const now = new Date()
      const sevenDaysAgo = subDays(now, 7)

      const dailyLogs = await ctx.prisma.dailyLog.findMany({
        where: {
          userId: ctx.user.partnerId,
          date: { gte: sevenDaysAgo },
        },
        select: { goalMet: true, date: true },
        orderBy: { date: "desc" },
        take: 7,
      })

      const daysOnGoal = countDaysOnGoal(dailyLogs)
      const healthState = getPetHealthState(daysOnGoal)

      return {
        daysOnGoal,
        healthState,
        recentDays: dailyLogs.map(log => ({
          date: log.date,
          goalMet: log.goalMet,
        })),
      }
    }),

  // Send interaction to partner's pet (wave, pet, highfive)
  sendInteraction: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/pet/interaction" } })
    .input(
      z.object({
        type: z.enum(["wave", "pet", "highfive"]),
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.partnerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You need a partner to send pet interactions",
        })
      }

      // Check cooldown
      const lastInteraction = await ctx.prisma.petInteraction.findFirst({
        where: {
          fromUserId: ctx.user.id,
          toUserId: ctx.user.partnerId,
        },
        orderBy: { createdAt: "desc" },
      })

      if (lastInteraction) {
        const timeSinceLast = Date.now() - lastInteraction.createdAt.getTime()
        if (timeSinceLast < PET_INTERACTION_COOLDOWN_MS) {
          const remainingMs = PET_INTERACTION_COOLDOWN_MS - timeSinceLast
          const remainingMin = Math.ceil(remainingMs / (60 * 1000))
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Please wait ${remainingMin} more minute${remainingMin > 1 ? "s" : ""} before sending another interaction`,
          })
        }
      }

      const interaction = await ctx.prisma.petInteraction.create({
        data: {
          fromUserId: ctx.user.id,
          toUserId: ctx.user.partnerId,
          type: input.type,
        },
      })

      return { success: true, interaction }
    }),

  // Get received interactions in the last 24 hours
  getInteractions: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/pet/interactions" } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      const oneDayAgo = subDays(new Date(), 1)

      const interactions = await ctx.prisma.petInteraction.findMany({
        where: {
          toUserId: ctx.user.id,
          createdAt: { gte: oneDayAgo },
        },
        include: {
          fromUser: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return interactions
    }),
})
