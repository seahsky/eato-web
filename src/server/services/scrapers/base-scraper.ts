import { prisma } from "@/lib/prisma";
import type { FoodDataSource, ScrapeJobType, ScrapeJobStatus, FoodProductCache } from "@prisma/client";

export interface ScrapeResult {
  productsProcessed: number;
  productsUpserted: number;
  productsSkipped: number;
  errors: number;
  nextCursor: string | null;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  delayBetweenRequests: number; // ms
}

const RATE_LIMITS: Record<FoodDataSource, RateLimitConfig> = {
  OPEN_FOOD_FACTS: {
    requestsPerSecond: 5,
    delayBetweenRequests: 200,
  },
  USDA: {
    requestsPerSecond: 10,
    delayBetweenRequests: 100,
  },
  MANUAL: {
    requestsPerSecond: 100,
    delayBetweenRequests: 10,
  },
};

export abstract class BaseScraper {
  protected dataSource: FoodDataSource;
  protected rateLimit: RateLimitConfig;
  protected maxProductsPerRun: number;
  protected jobId: string | null = null;
  private lastRequestTime = 0;

  constructor(dataSource: FoodDataSource, maxProductsPerRun = 5000) {
    this.dataSource = dataSource;
    this.rateLimit = RATE_LIMITS[dataSource];
    this.maxProductsPerRun = maxProductsPerRun;
  }

  abstract scrapeIncremental(cursor?: string): Promise<ScrapeResult>;

  abstract scrapeByQuery(query: string): Promise<number>;

  protected async rateLimitedFetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimit.delayBetweenRequests) {
      await this.sleep(this.rateLimit.delayBetweenRequests - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();

    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": process.env.OPEN_FOOD_FACTS_USER_AGENT || "Eato/1.0",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  protected async upsertProduct(
    product: Omit<FoodProductCache, "id" | "updatedAt">
  ): Promise<boolean> {
    try {
      await prisma.foodProductCache.upsert({
        where: { sourceId: product.sourceId },
        create: product,
        update: {
          ...product,
          // Don't reset popularity on update
          popularity: undefined,
          scrapedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error(`Failed to upsert product ${product.sourceId}:`, error);
      return false;
    }
  }

  async startJob(jobType: ScrapeJobType, cursor?: string): Promise<string> {
    const job = await prisma.scrapeJob.create({
      data: {
        dataSource: this.dataSource,
        jobType,
        status: "RUNNING",
        lastCursor: cursor,
      },
    });

    this.jobId = job.id;
    return job.id;
  }

  protected async updateJobProgress(progress: {
    productsScraped?: number;
    productsUpdated?: number;
    errorCount?: number;
    lastCursor?: string;
    lastError?: string;
  }): Promise<void> {
    if (!this.jobId) return;

    await prisma.scrapeJob.update({
      where: { id: this.jobId },
      data: {
        ...progress,
        ...(progress.productsScraped !== undefined && {
          productsScraped: { increment: progress.productsScraped },
        }),
        ...(progress.productsUpdated !== undefined && {
          productsUpdated: { increment: progress.productsUpdated },
        }),
        ...(progress.errorCount !== undefined && {
          errorCount: { increment: progress.errorCount },
        }),
      },
    });
  }

  async completeJob(status: ScrapeJobStatus, lastCursor?: string): Promise<void> {
    if (!this.jobId) return;

    await prisma.scrapeJob.update({
      where: { id: this.jobId },
      data: {
        status,
        completedAt: new Date(),
        lastCursor,
      },
    });

    // Update scrape config
    await prisma.scrapeConfig.upsert({
      where: { dataSource: this.dataSource },
      create: {
        dataSource: this.dataSource,
        lastIncrementalSync: new Date(),
      },
      update: {
        lastIncrementalSync: new Date(),
        totalProducts: await prisma.foodProductCache.count({
          where: { dataSource: this.dataSource },
        }),
      },
    });

    this.jobId = null;
  }

  async getLastCursor(): Promise<string | null> {
    const lastJob = await prisma.scrapeJob.findFirst({
      where: {
        dataSource: this.dataSource,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
      select: { lastCursor: true },
    });

    return lastJob?.lastCursor ?? null;
  }

  async run(jobType: ScrapeJobType = "INCREMENTAL"): Promise<ScrapeResult> {
    const cursor = jobType === "INCREMENTAL" ? await this.getLastCursor() : undefined;

    await this.startJob(jobType, cursor ?? undefined);

    try {
      const result = await this.scrapeIncremental(cursor ?? undefined);
      await this.completeJob("COMPLETED", result.nextCursor ?? undefined);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await prisma.scrapeJob.update({
        where: { id: this.jobId! },
        data: { lastError: errorMessage },
      });
      await this.completeJob("FAILED");
      throw error;
    }
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected calculateQualityScore(product: {
    name: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g?: number;
    imageUrl?: string | null;
  }): number {
    let score = 0;

    // Has name (10 points)
    if (product.name && product.name.length > 2) score += 10;

    // Has calories (20 points)
    if (product.caloriesPer100g > 0) score += 20;

    // Has macros (15 points each)
    if (product.proteinPer100g > 0) score += 15;
    if (product.carbsPer100g > 0) score += 15;
    if (product.fatPer100g > 0) score += 15;

    // Has fiber (10 points)
    if (product.fiberPer100g && product.fiberPer100g > 0) score += 10;

    // Has image (15 points)
    if (product.imageUrl) score += 15;

    return Math.min(score, 100);
  }

  protected hasCompleteNutrition(nutrients: {
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  }): boolean {
    return (
      nutrients.caloriesPer100g > 0 &&
      nutrients.proteinPer100g >= 0 &&
      nutrients.carbsPer100g >= 0 &&
      nutrients.fatPer100g >= 0
    );
  }
}
