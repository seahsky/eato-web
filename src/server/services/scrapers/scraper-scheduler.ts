import cron, { type ScheduledTask as CronTask } from "node-cron";
import { prisma } from "@/lib/prisma";
import { OFFScraper } from "./off-scraper";
import { USDAcraper } from "./usda-scraper";

interface ScheduledTask {
  name: string;
  schedule: string;
  task: CronTask | null;
}

export class ScraperScheduler {
  private tasks: ScheduledTask[] = [];
  private isRunning = false;

  constructor() {
    // Define scheduled tasks
    this.tasks = [
      {
        name: "off-incremental",
        schedule: "0 2 * * *", // Daily at 2 AM
        task: null,
      },
      {
        name: "usda-incremental",
        schedule: "0 3 * * *", // Daily at 3 AM
        task: null,
      },
      {
        name: "demand-scrape",
        schedule: "0 */6 * * *", // Every 6 hours
        task: null,
      },
      {
        name: "popularity-update",
        schedule: "0 4 * * 0", // Weekly Sunday at 4 AM
        task: null,
      },
    ];
  }

  start(): void {
    if (this.isRunning) {
      console.log("[Scheduler] Already running");
      return;
    }

    console.log("[Scheduler] Starting scraper scheduler");

    // OFF incremental scrape
    this.tasks[0].task = cron.schedule(this.tasks[0].schedule, async () => {
      await this.runOFFIncrementalScrape();
    });

    // USDA incremental scrape
    this.tasks[1].task = cron.schedule(this.tasks[1].schedule, async () => {
      await this.runUSDAIncrementalScrape();
    });

    // Demand-based scrape
    this.tasks[2].task = cron.schedule(this.tasks[2].schedule, async () => {
      await this.runDemandScrape();
    });

    // Popularity update
    this.tasks[3].task = cron.schedule(this.tasks[3].schedule, async () => {
      await this.runPopularityUpdate();
    });

    this.isRunning = true;
    console.log("[Scheduler] All tasks scheduled");
  }

  stop(): void {
    console.log("[Scheduler] Stopping scraper scheduler");

    for (const task of this.tasks) {
      if (task.task) {
        task.task.stop();
        task.task = null;
      }
    }

    this.isRunning = false;
    console.log("[Scheduler] All tasks stopped");
  }

  async runOFFIncrementalScrape(): Promise<void> {
    const enabled = process.env.SCRAPE_OFF_ENABLED !== "false";
    if (!enabled) {
      console.log("[Scheduler] OFF scraping disabled");
      return;
    }

    console.log("[Scheduler] Starting OFF incremental scrape");

    try {
      const maxProducts = parseInt(process.env.SCRAPE_MAX_PRODUCTS_PER_RUN || "5000", 10);
      const scraper = new OFFScraper(maxProducts);
      const result = await scraper.run("INCREMENTAL");

      console.log("[Scheduler] OFF scrape completed:", result);
    } catch (error) {
      console.error("[Scheduler] OFF scrape failed:", error);
    }
  }

  async runUSDAIncrementalScrape(): Promise<void> {
    const enabled = process.env.SCRAPE_USDA_ENABLED !== "false";
    if (!enabled) {
      console.log("[Scheduler] USDA scraping disabled");
      return;
    }

    console.log("[Scheduler] Starting USDA incremental scrape");

    try {
      const maxProducts = parseInt(process.env.SCRAPE_MAX_PRODUCTS_PER_RUN || "5000", 10);
      const scraper = new USDAcraper(maxProducts);
      const result = await scraper.run("INCREMENTAL");

      console.log("[Scheduler] USDA scrape completed:", result);
    } catch (error) {
      console.error("[Scheduler] USDA scrape failed:", error);
    }
  }

  async runDemandScrape(): Promise<void> {
    console.log("[Scheduler] Starting demand-based scrape");

    try {
      // Get top search demands that haven't been scraped yet
      const demands = await prisma.searchDemand.findMany({
        where: { scrapeAttempted: false },
        orderBy: { hitCount: "desc" },
        take: 20,
      });

      if (demands.length === 0) {
        console.log("[Scheduler] No pending search demands");
        return;
      }

      const offScraper = new OFFScraper(100);
      const usdaScraper = new USDAcraper(100);

      for (const demand of demands) {
        console.log(`[Scheduler] Scraping for query: ${demand.query} (hits: ${demand.hitCount})`);

        let foundResults = false;

        // Try both scrapers
        const offCount = await offScraper.scrapeByQuery(demand.query);
        const usdaCount = await usdaScraper.scrapeByQuery(demand.query);

        foundResults = offCount > 0 || usdaCount > 0;

        // Mark as attempted
        await prisma.searchDemand.update({
          where: { id: demand.id },
          data: {
            scrapeAttempted: true,
            scrapeFoundResults: foundResults,
          },
        });
      }

      console.log("[Scheduler] Demand scrape completed");
    } catch (error) {
      console.error("[Scheduler] Demand scrape failed:", error);
    }
  }

  async runPopularityUpdate(): Promise<void> {
    console.log("[Scheduler] Starting popularity update");

    try {
      // Get popular products that haven't been updated recently
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const staleProducts = await prisma.foodProductCache.findMany({
        where: {
          popularity: { gt: 50 },
          updatedAt: { lt: thirtyDaysAgo },
        },
        select: { sourceId: true, dataSource: true, barcode: true, fdcId: true },
        take: 100,
      });

      console.log(`[Scheduler] Found ${staleProducts.length} stale popular products`);

      // Re-fetch and update each product
      // This is a simplified version - could be expanded to batch fetch
      for (const product of staleProducts) {
        if (product.dataSource === "OPEN_FOOD_FACTS" && product.barcode) {
          // Could re-fetch from OFF by barcode
          // For now, just touch the updatedAt
          await prisma.foodProductCache.update({
            where: { sourceId: product.sourceId },
            data: { updatedAt: new Date() },
          });
        } else if (product.dataSource === "USDA" && product.fdcId) {
          // Could re-fetch from USDA by fdcId
          await prisma.foodProductCache.update({
            where: { sourceId: product.sourceId },
            data: { updatedAt: new Date() },
          });
        }
      }

      console.log("[Scheduler] Popularity update completed");
    } catch (error) {
      console.error("[Scheduler] Popularity update failed:", error);
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
