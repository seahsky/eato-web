import cron, { type ScheduledTask as CronTask } from "node-cron";
import { prisma } from "@/lib/prisma";

interface ScheduledTask {
  name: string;
  schedule: string;
  task: CronTask | null;
}

/**
 * Scraper Scheduler
 *
 * Note: Since FatSecret is queried directly via API, we no longer need
 * scheduled scraping for OFF/USDA. This scheduler now only handles:
 * - Popularity updates for cached products
 * - Cleanup of stale search demands
 */
export class ScraperScheduler {
  private tasks: ScheduledTask[] = [];
  private isRunning = false;

  constructor() {
    this.tasks = [
      {
        name: "popularity-update",
        schedule: "0 4 * * 0", // Weekly Sunday at 4 AM
        task: null,
      },
      {
        name: "demand-cleanup",
        schedule: "0 5 * * 0", // Weekly Sunday at 5 AM
        task: null,
      },
    ];
  }

  start(): void {
    if (this.isRunning) {
      console.log("[Scheduler] Already running");
      return;
    }

    console.log("[Scheduler] Starting scheduler");

    // Popularity update
    this.tasks[0].task = cron.schedule(this.tasks[0].schedule, async () => {
      await this.runPopularityUpdate();
    });

    // Demand cleanup
    this.tasks[1].task = cron.schedule(this.tasks[1].schedule, async () => {
      await this.runDemandCleanup();
    });

    this.isRunning = true;
    console.log("[Scheduler] All tasks scheduled");
  }

  stop(): void {
    console.log("[Scheduler] Stopping scheduler");

    for (const task of this.tasks) {
      if (task.task) {
        task.task.stop();
        task.task = null;
      }
    }

    this.isRunning = false;
    console.log("[Scheduler] All tasks stopped");
  }

  async runPopularityUpdate(): Promise<void> {
    console.log("[Scheduler] Starting popularity update");

    try {
      // Touch popular products to keep them fresh
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await prisma.foodProductCache.updateMany({
        where: {
          popularity: { gt: 50 },
          updatedAt: { lt: thirtyDaysAgo },
        },
        data: { updatedAt: new Date() },
      });

      console.log(`[Scheduler] Updated ${result.count} popular products`);
    } catch (error) {
      console.error("[Scheduler] Popularity update failed:", error);
    }
  }

  async runDemandCleanup(): Promise<void> {
    console.log("[Scheduler] Starting demand cleanup");

    try {
      // Clean up old search demands that have been attempted
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const result = await prisma.searchDemand.deleteMany({
        where: {
          scrapeAttempted: true,
          lastSearched: { lt: sevenDaysAgo },
        },
      });

      console.log(`[Scheduler] Cleaned up ${result.count} old search demands`);
    } catch (error) {
      console.error("[Scheduler] Demand cleanup failed:", error);
    }
  }

  getStatus(): { isRunning: boolean; tasks: { name: string; schedule: string }[] } {
    return {
      isRunning: this.isRunning,
      tasks: this.tasks.map((t) => ({ name: t.name, schedule: t.schedule })),
    };
  }
}

// Singleton instance
let schedulerInstance: ScraperScheduler | null = null;

export function startScheduler(): ScraperScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new ScraperScheduler();
  }
  schedulerInstance.start();
  return schedulerInstance;
}

export function stopScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}

export function getScheduler(): ScraperScheduler | null {
  return schedulerInstance;
}
