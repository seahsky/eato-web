import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting streak features backfill (raw MongoDB)...\n");

  // Use raw MongoDB query to find users missing any gamification field.
  // This avoids prisma.user.findMany() which throws on null non-nullable fields.
  const db = (prisma as any).$runCommandRaw.bind(prisma);

  // Find users missing any gamification field
  const findResult = (await db({
    find: "User",
    filter: {
      $or: [
        { lastRestDayReset: { $eq: null } },
        { lastRestDayReset: { $exists: false } },
        { lastShieldReset: { $eq: null } },
        { lastShieldReset: { $exists: false } },
        { restDaysRemaining: { $eq: null } },
        { restDaysRemaining: { $exists: false } },
        { restDayDates: { $eq: null } },
        { restDayDates: { $exists: false } },
        { partnerShields: { $eq: null } },
        { partnerShields: { $exists: false } },
        { shieldsUsedThisMonth: { $eq: null } },
        { shieldsUsedThisMonth: { $exists: false } },
        { currentStreak: { $eq: null } },
        { currentStreak: { $exists: false } },
        { longestStreak: { $eq: null } },
        { longestStreak: { $exists: false } },
        { goalStreak: { $eq: null } },
        { goalStreak: { $exists: false } },
        { longestGoalStreak: { $eq: null } },
        { longestGoalStreak: { $exists: false } },
        { streakFreezes: { $eq: null } },
        { streakFreezes: { $exists: false } },
        { weeklyStreak: { $eq: null } },
        { weeklyStreak: { $exists: false } },
        { longestWeeklyStreak: { $eq: null } },
        { longestWeeklyStreak: { $exists: false } },
        { currentWeekDays: { $eq: null } },
        { currentWeekDays: { $exists: false } },
      ],
    },
    projection: { _id: 1, email: 1, name: 1 },
  })) as { cursor: { firstBatch: Array<{ _id: { $oid: string }; email?: string; name?: string }> } };

  const usersToFix = findResult.cursor.firstBatch;
  console.log(`Found ${usersToFix.length} users with missing gamification fields\n`);

  if (usersToFix.length === 0) {
    console.log("✨ No users need backfilling!");
    return;
  }

  // Log which users will be fixed
  for (const user of usersToFix) {
    console.log(`  Will fix: ${user.email || user.name || user._id.$oid}`);
  }

  const now = new Date();

  // Define default values for each field.
  // We use individual update pipelines per field so we only set fields that are
  // actually missing/null, preserving any existing values.
  const fieldDefaults: Array<{ field: string; value: unknown }> = [
    { field: "lastRestDayReset", value: { $date: now.toISOString() } },
    { field: "lastShieldReset", value: { $date: now.toISOString() } },
    { field: "restDaysRemaining", value: 6 },
    { field: "restDayDates", value: [] },
    { field: "partnerShields", value: 2 },
    { field: "shieldsUsedThisMonth", value: [] },
    { field: "currentStreak", value: 0 },
    { field: "longestStreak", value: 0 },
    { field: "goalStreak", value: 0 },
    { field: "longestGoalStreak", value: 0 },
    { field: "streakFreezes", value: 0 },
    { field: "weeklyStreak", value: 0 },
    { field: "longestWeeklyStreak", value: 0 },
    { field: "currentWeekDays", value: 0 },
  ];

  // Run one updateMany per field, setting it only where null or missing
  let totalModified = 0;
  for (const { field, value } of fieldDefaults) {
    const result = (await db({
      update: "User",
      updates: [
        {
          q: {
            $or: [{ [field]: { $eq: null } }, { [field]: { $exists: false } }],
          },
          u: { $set: { [field]: value } },
          multi: true,
        },
      ],
    })) as { nModified: number };

    const modified = result.nModified || 0;
    if (modified > 0) {
      console.log(`  ✅ ${field}: fixed ${modified} users`);
      totalModified += modified;
    }
  }

  console.log(`\n📊 Backfill Summary:`);
  console.log(`   Users identified: ${usersToFix.length}`);
  console.log(`   Total field updates applied: ${totalModified}`);
  console.log("\n✨ Backfill complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during backfill:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
