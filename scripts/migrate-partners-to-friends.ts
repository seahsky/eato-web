/**
 * One-off migration: convert legacy 1:1 Partner pairs into Friendship rows.
 *
 * Run AFTER the schema change has been applied (`npm run prisma:push`) but
 * BEFORE deleting the legacy `partnerId` field from any records that still
 * carry it. Idempotent — safe to re-run.
 *
 * Usage:
 *   tsx scripts/migrate-partners-to-friends.ts
 *
 * The Prisma client no longer types `partnerId` — we read it via the raw
 * MongoDB driver to find pairs, then write Friendship rows through Prisma.
 */
import { MongoClient } from "mongodb";
import { PrismaClient } from "@prisma/client";

interface LegacyUser {
  // partnerId may be an ObjectId (with toString) or a stringified id, or absent.
  partnerId?: unknown;
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const mongo = new MongoClient(url);
  const prisma = new PrismaClient();

  try {
    await mongo.connect();
    const db = mongo.db();
    const users = db.collection<LegacyUser>("User");

    const cursor = users.find({ partnerId: { $exists: true, $ne: null } });
    const seen = new Set<string>();
    let created = 0;
    let skipped = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;

      const userId = doc._id.toString();
      const partnerIdRaw = doc.partnerId;
      let partnerId: string | undefined;
      if (typeof partnerIdRaw === "string") {
        partnerId = partnerIdRaw;
      } else if (
        partnerIdRaw &&
        typeof partnerIdRaw === "object" &&
        "toString" in partnerIdRaw &&
        typeof (partnerIdRaw as { toString: unknown }).toString === "function"
      ) {
        partnerId = String(partnerIdRaw);
      }
      if (!partnerId) continue;

      const [userAId, userBId] = orderedPair(userId, partnerId);
      const key = `${userAId}:${userBId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Idempotent — upsert a single Friendship row per pair.
      try {
        await prisma.friendship.upsert({
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
        created++;
      } catch (err) {
        console.error(`Failed pair ${key}:`, err);
        skipped++;
      }
    }

    console.log(
      `Migration complete: ${created} friendship rows upserted, ${skipped} skipped.`
    );
  } finally {
    await mongo.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
