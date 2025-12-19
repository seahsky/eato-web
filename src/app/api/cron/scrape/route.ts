import { NextRequest, NextResponse } from "next/server";
import { OFFScraper, USDAcraper } from "@/server/services/scrapers";
import { getLocalCacheStats, setupTextIndexes } from "@/server/services/local-food-search";
import { prisma } from "@/lib/prisma";

// Secret for authorization (set in environment)
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Manual trigger for scraping operations
 *
 * GET /api/cron/scrape - Get scrape status and stats
 * POST /api/cron/scrape - Trigger a scrape job
 *
 * Headers:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * POST body:
 *   {
 *     "source": "off" | "usda" | "both",
 *     "maxProducts": number (optional, default 5000),
 *     "jobType": "INCREMENTAL" | "FULL" (optional, default "INCREMENTAL")
 *   }
 */
export async function GET(req: NextRequest) {
  // Verify authorization
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Get stats
    const [cacheStats, recentJobs] = await Promise.all([
      getLocalCacheStats(),
      prisma.scrapeJob.findMany({
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          dataSource: true,
          jobType: true,
          status: true,
          startedAt: true,
          completedAt: true,
          productsScraped: true,
          productsUpdated: true,
          errorCount: true,
          lastError: true,
        },
      }),
    ]);

    return NextResponse.json({
      cache: cacheStats,
      recentJobs,
      config: {
        localSearchEnabled: process.env.ENABLE_LOCAL_SEARCH === "true",
        offEnabled: process.env.SCRAPE_OFF_ENABLED !== "false",
        usdaEnabled: process.env.SCRAPE_USDA_ENABLED !== "false",
        maxProductsPerRun: process.env.SCRAPE_MAX_PRODUCTS_PER_RUN || "5000",
      },
    });
  } catch (error) {
    console.error("[Scrape API] Error getting stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Verify authorization
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const { source, maxProducts, jobType, action } = body as {
      source?: "off" | "usda" | "both";
      maxProducts?: number;
      jobType?: "INCREMENTAL" | "FULL";
      action?: "setup-indexes" | "scrape";
    };

    // Handle special actions
    if (action === "setup-indexes") {
      await setupTextIndexes();
      return NextResponse.json({ success: true, message: "Text indexes created" });
    }

    // Default to scrape action
    const selectedSource = source || "both";
    const selectedMaxProducts = maxProducts || 5000;
    const selectedJobType = jobType || "INCREMENTAL";

    const results: Record<string, unknown> = {};

    // Run scrapers (not in parallel to avoid rate limit issues)
    if (selectedSource === "off" || selectedSource === "both") {
      const offEnabled = process.env.SCRAPE_OFF_ENABLED !== "false";
      if (offEnabled) {
        console.log("[Scrape API] Starting OFF scrape...");
        const offScraper = new OFFScraper(selectedMaxProducts);
        results.off = await offScraper.run(selectedJobType);
      } else {
        results.off = { skipped: true, reason: "OFF scraping disabled" };
      }
    }

    if (selectedSource === "usda" || selectedSource === "both") {
      const usdaEnabled = process.env.SCRAPE_USDA_ENABLED !== "false";
      if (usdaEnabled) {
        console.log("[Scrape API] Starting USDA scrape...");
        const usdaScraper = new USDAcraper(selectedMaxProducts);
        results.usda = await usdaScraper.run(selectedJobType);
      } else {
        results.usda = { skipped: true, reason: "USDA scraping disabled" };
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("[Scrape API] Error running scrape:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// Allow long-running requests (up to 5 minutes for VPS)
export const maxDuration = 300;
