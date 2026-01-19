import { NextRequest, NextResponse } from "next/server";
import { getLocalCacheStats, setupTextIndexes } from "@/server/services/local-food-search";
import { prisma } from "@/lib/prisma";

// Secret for authorization (set in environment)
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cache status and management endpoint
 *
 * Note: With FatSecret as the primary API, scraping is no longer needed.
 * This endpoint now handles cache stats and text index setup.
 *
 * GET /api/cron/scrape - Get cache status and stats
 * POST /api/cron/scrape - Administrative actions (setup-indexes)
 *
 * Headers:
 *   Authorization: Bearer <CRON_SECRET>
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
        primaryAPI: "FatSecret",
      },
    });
  } catch (error) {
    console.error("[Cache API] Error getting stats:", error);
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
    const { action } = body as {
      action?: "setup-indexes" | "cleanup";
    };

    if (action === "setup-indexes") {
      await setupTextIndexes();
      return NextResponse.json({ success: true, message: "Text indexes created" });
    }

    if (action === "cleanup") {
      // Clean up old search demands
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await prisma.searchDemand.deleteMany({
        where: {
          scrapeAttempted: true,
          lastSearched: { lt: sevenDaysAgo },
        },
      });
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${result.count} old search demands`,
      });
    }

    return NextResponse.json(
      { error: "Unknown action. Supported actions: setup-indexes, cleanup" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Cache API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// Allow requests up to 30 seconds
export const maxDuration = 30;
