import Agenda, { Job } from "agenda";

// Use the same MongoDB connection as Prisma
const mongoUri = process.env.DATABASE_URL;

// Singleton Agenda instance
let agendaInstance: Agenda | null = null;
let isStarting = false;

/**
 * Get or create the Agenda instance
 * Uses lazy initialization for serverless compatibility
 */
export async function getAgenda(): Promise<Agenda> {
  if (agendaInstance) {
    return agendaInstance;
  }

  // Prevent multiple simultaneous initialization
  if (isStarting) {
    // Wait for initialization to complete
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (agendaInstance) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
    return agendaInstance!;
  }

  if (!mongoUri) {
    throw new Error("DATABASE_URL is required for Agenda scheduler");
  }

  isStarting = true;

  try {
    agendaInstance = new Agenda({
      db: {
        address: mongoUri,
        collection: "agendaJobs",
      },
      defaultConcurrency: 5,
      maxConcurrency: 20,
      defaultLockLimit: 0,
      defaultLockLifetime: 10000, // 10 seconds
    });

    // Define all jobs
    await defineJobs(agendaInstance);

    // Start the agenda
    await agendaInstance.start();

    console.log("Agenda scheduler started");

    return agendaInstance;
  } finally {
    isStarting = false;
  }
}

/**
 * Define all job types
 */
async function defineJobs(_agenda: Agenda): Promise<void> {
  // Circle scheduler — registers fire-moment / close-moment / reschedule /
  // day-card jobs and seeds the next 24h of fires on startup.
  const { registerCircleSchedulerJobs, rescheduleAllCircleMoments } =
    await import("@/server/services/circleScheduler");
  await registerCircleSchedulerJobs();
  // Best-effort seed: failure here shouldn't block agenda start.
  rescheduleAllCircleMoments().catch((err) => {
    console.error("Initial circle reschedule failed:", err);
  });
}

/**
 * Graceful shutdown
 */
export async function stopAgenda(): Promise<void> {
  if (agendaInstance) {
    await agendaInstance.stop();
    agendaInstance = null;
  }
}

// Re-export types
export type { Agenda, Job };
