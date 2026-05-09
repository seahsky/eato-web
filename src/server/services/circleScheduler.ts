import { prisma } from "@/lib/prisma";
import { getAgenda, type Job } from "@/lib/agenda";
import { sendNotificationToUser } from "@/lib/notifications/sender";
import type { MealMomentKind } from "@prisma/client";

/**
 * Circle Scheduler
 *
 * Translates per-circle schedule rows into Agenda jobs that fire MealMoments
 * at the right local time, pre-create empty MealMomentEntry slots for all
 * members, and push CIRCLE_MOMENT_FIRED to each member's devices.
 *
 * Two job kinds:
 *   - circle:fire-moment  — fires a single moment for a (circleId, scheduleId)
 *   - circle:close-moment — runs at closesAt to compose the per-meal grid
 *   - circle:reschedule   — daily-rolling job that re-evaluates all circles
 *                           and books the next 24h of fire-moment jobs
 *   - circle:day-card     — nightly per-circle, builds the DayCard
 *
 * DST-safe: we compute "next firing UTC instant" each time we book, rather
 * than persisting an absolute UTC time. So a 09:00 local schedule reschedules
 * itself across DST without manual intervention.
 */

const FIRE_JOB = "circle:fire-moment";
const CLOSE_JOB = "circle:close-moment";
const RESCHEDULE_JOB = "circle:reschedule";
const DAY_CARD_JOB = "circle:day-card";

const RESCHEDULE_HORIZON_HOURS = 26; // a little >24 to absorb DST jitter

let jobsRegistered = false;

/**
 * Compute the next UTC Date at which a (timezone, localTime, daysOfWeek)
 * combo will fire, strictly after `from`.
 *
 * Approach: iterate forward day by day (max 14 iterations to cover any
 * weekly schedule), constructing the candidate local datetime via
 * Intl.DateTimeFormat to read the offset for that day, then adjusting back
 * to UTC. Avoids pulling in a tz library.
 */
export function nextFiringInstant(
  timezone: string,
  localTime: string,
  daysOfWeek: number,
  from: Date
): Date | null {
  if (!daysOfWeek) return null;
  const [hh, mm] = localTime.split(":").map(Number);

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const probe = new Date(from.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    // Read the local Y/M/D and weekday of the probe in `timezone`.
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour12: false,
    }).formatToParts(probe);
    const get = (type: string) => parts.find((p) => p.type === type)?.value;
    const y = Number(get("year"));
    const mo = Number(get("month"));
    const d = Number(get("day"));
    const wd = get("weekday") ?? "Sun";

    // Sun=0 ... Sat=6
    const wdIndex: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const wdNum = wdIndex[wd] ?? 0;
    const isEnabled = (daysOfWeek & (1 << wdNum)) !== 0;
    if (!isEnabled) continue;

    // Build the candidate UTC instant whose local-time-in-`timezone` equals
    // (y, mo, d, hh, mm). Iterate at most twice to converge across DST.
    let utc = Date.UTC(y, mo - 1, d, hh, mm, 0);
    for (let i = 0; i < 2; i++) {
      const back = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date(utc));
      const bg = (t: string) => Number(back.find((p) => p.type === t)?.value);
      const bH = bg("hour") % 24;
      const bM = bg("minute");
      const drift = (hh - bH) * 60 + (mm - bM);
      if (drift === 0) break;
      utc += drift * 60_000;
    }

    if (utc > from.getTime()) {
      return new Date(utc);
    }
  }
  return null;
}

/**
 * Compute the UTC Date of the next "midnight in `timezone`" after `from`.
 * Used for booking the per-circle DayCard nightly job.
 */
export function nextLocalMidnightUtc(timezone: string, from: Date): Date {
  // Same algorithm as nextFiringInstant but with localTime "00:00" and
  // daysOfWeek = 127 (every day).
  const next = nextFiringInstant(timezone, "00:00", 127, from);
  // Should never be null since daysOfWeek=127, but fall back defensively.
  return next ?? new Date(from.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Fire a single MealMoment now: create the row, pre-create empty entry
 * slots for every member, schedule the close-moment job, and push.
 *
 * Used both by the scheduled fire-moment Agenda job and inline by
 * circle.callMoment for ad-hoc kicks.
 */
export async function fireMealMoment(args: {
  circleId: string;
  kind: MealMomentKind;
  label: string;
  scheduleId?: string;
  triggeredByUserId?: string;
}): Promise<{ id: string; firedAt: Date; closesAt: Date }> {
  const circle = await prisma.circle.findUnique({
    where: { id: args.circleId },
    include: { members: { select: { userId: true } } },
  });
  if (!circle) {
    throw new Error(`Circle ${args.circleId} not found`);
  }

  const firedAt = new Date();
  const closesAt = new Date(
    firedAt.getTime() + circle.mealMomentWindowMinutes * 60 * 1000
  );

  const moment = await prisma.mealMoment.create({
    data: {
      circleId: circle.id,
      kind: args.kind,
      firedAt,
      closesAt,
      scheduleId: args.scheduleId ?? null,
      triggeredByUserId: args.triggeredByUserId ?? null,
      label: args.label,
    },
  });

  // Pre-create empty entry slots for every member so the grid renders
  // naturally even if nobody logs.
  await prisma.mealMomentEntry.createMany({
    data: circle.members.map((m) => ({
      momentId: moment.id,
      userId: m.userId,
    })),
  });

  // Push to all members. Skip the trigger user for ad-hoc.
  const memberIdsToNotify = circle.members
    .map((m) => m.userId)
    .filter((id) => id !== args.triggeredByUserId);

  await Promise.all(
    memberIdsToNotify.map((userId) =>
      notifyMealMomentFired(userId, {
        circleId: circle.id,
        circleName: circle.name,
        circleEmoji: circle.emoji,
        momentId: moment.id,
        label: args.label,
        kind: args.kind,
      }).catch((err) =>
        console.error(`fireMealMoment notify ${userId} failed:`, err)
      )
    )
  );

  // Schedule the close job at closesAt. Image composite happens there.
  try {
    const agenda = await getAgenda();
    await agenda.schedule(closesAt, CLOSE_JOB, { momentId: moment.id });
  } catch (err) {
    console.error("Failed to schedule close-moment job:", err);
  }

  return { id: moment.id, firedAt, closesAt };
}

async function notifyMealMomentFired(
  userId: string,
  payload: {
    circleId: string;
    circleName: string;
    circleEmoji: string;
    momentId: string;
    label: string;
    kind: MealMomentKind;
  }
): Promise<void> {
  // Respect per-user toggles for circle pushes.
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });
  if (settings) {
    if (
      payload.kind === "ADHOC" &&
      settings.circleAdhocCallsEnabled === false
    ) {
      return;
    }
    if (
      payload.kind === "SCHEDULED" &&
      settings.circleMealMomentEnabled === false
    ) {
      return;
    }
  }

  const title =
    payload.kind === "ADHOC"
      ? `${payload.circleEmoji} ${payload.circleName} is eating`
      : `${payload.circleEmoji} ${payload.circleName} · ${payload.label}`;
  const body =
    payload.kind === "ADHOC"
      ? "Snap your plate to join the moment"
      : "Time to log — snap your plate";

  await sendNotificationToUser(userId, {
    title,
    body,
    tag: `circle-moment-${payload.momentId}`,
    url: `eato://circle/${payload.circleId}/moment/${payload.momentId}`,
    data: {
      type: "CIRCLE_MOMENT_FIRED",
      circleId: payload.circleId,
      momentId: payload.momentId,
      kind: payload.kind,
    },
  });
}

/**
 * Re-evaluate all circles and book the next 24h of scheduled moments.
 * Idempotent: cancels any pending fire-moment jobs before re-booking.
 *
 * Called daily via a self-rescheduling Agenda job (registered below) and
 * once at server start to seed the queue.
 */
export async function rescheduleAllCircleMoments(): Promise<void> {
  const agenda = await getAgenda();
  const now = new Date();
  const horizonEnd = new Date(
    now.getTime() + RESCHEDULE_HORIZON_HOURS * 60 * 60 * 1000
  );

  // Drop any future fire-moment jobs we previously scheduled — we'll rebook.
  await agenda.cancel({ name: FIRE_JOB });

  const circles = await prisma.circle.findMany({
    include: {
      schedules: { where: { enabled: true } },
    },
  });

  for (const circle of circles) {
    for (const schedule of circle.schedules) {
      // A given schedule could fire multiple times in the horizon (e.g., 26h
      // window catches today's and tomorrow's instance). Walk forward.
      let cursor = now;
      // Cap iterations to avoid pathological loops.
      for (let i = 0; i < 4; i++) {
        const next = nextFiringInstant(
          circle.timezone,
          schedule.localTime,
          schedule.daysOfWeek,
          cursor
        );
        if (!next || next > horizonEnd) break;
        await agenda.schedule(next, FIRE_JOB, {
          circleId: circle.id,
          scheduleId: schedule.id,
        });
        cursor = next;
      }
    }
    // Always rebook the day-card nightly job for the next local midnight.
    const nextMidnight = nextLocalMidnightUtc(circle.timezone, now);
    await agenda.cancel({
      name: DAY_CARD_JOB,
      "data.circleId": circle.id,
    });
    await agenda.schedule(nextMidnight, DAY_CARD_JOB, { circleId: circle.id });
  }

  // Re-arm the daily reschedule pass for ~24h from now.
  await agenda.cancel({ name: RESCHEDULE_JOB });
  await agenda.schedule(
    new Date(now.getTime() + 24 * 60 * 60 * 1000),
    RESCHEDULE_JOB,
    {}
  );
}

/**
 * Register Agenda job handlers for circle scheduling. Safe to call
 * multiple times — guarded by a module-level flag.
 */
export async function registerCircleSchedulerJobs(): Promise<void> {
  if (jobsRegistered) return;
  const agenda = await getAgenda();

  agenda.define(FIRE_JOB, async (job: Job) => {
    const { circleId, scheduleId } = job.attrs.data as {
      circleId: string;
      scheduleId?: string;
    };
    const schedule = scheduleId
      ? await prisma.circleSchedule.findUnique({ where: { id: scheduleId } })
      : null;
    if (!schedule || !schedule.enabled) {
      // Schedule was deleted or disabled between booking and firing — skip.
      return;
    }
    await fireMealMoment({
      circleId,
      kind: "SCHEDULED",
      label: schedule.label,
      scheduleId: schedule.id,
    });
  });

  agenda.define(CLOSE_JOB, async (job: Job) => {
    const { momentId } = job.attrs.data as { momentId: string };
    try {
      const { composeMomentGrid } = await import("./momentImageComposer");
      await composeMomentGrid(momentId);
    } catch (err) {
      console.error("close-moment composeMomentGrid failed:", err);
    }
  });

  agenda.define(RESCHEDULE_JOB, async () => {
    await rescheduleAllCircleMoments();
  });

  agenda.define(DAY_CARD_JOB, async (job: Job) => {
    const { circleId } = job.attrs.data as { circleId: string };
    try {
      const { composeDayCard } = await import("./momentImageComposer");
      await composeDayCard(circleId);
    } catch (err) {
      console.error("day-card composeDayCard failed:", err);
    }
  });

  jobsRegistered = true;
}
