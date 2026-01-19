import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting streak features backfill...\n");

  // Get all users to backfill
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      restDaysRemaining: true,
      weeklyStreak: true,
      partnerShields: true,
    },
  });

  console.log(`Found ${users.length} users to process\n`);

  let restDaysInitialized = 0;
  let weeklyStreakInitialized = 0;
  let shieldsInitialized = 0;

  for (const user of users) {
    const updates: any = {};
    const features: string[] = [];

    // Initialize rest days if needed
    if (user.restDaysRemaining === null || user.restDaysRemaining === undefined) {
      updates.restDaysRemaining = 6;
      updates.restDayDates = [];
      updates.lastRestDayReset = new Date();
      features.push("rest days");
      restDaysInitialized++;
    }

    // Initialize weekly streaks if needed
    if (user.weeklyStreak === null || user.weeklyStreak === undefined) {
      updates.weeklyStreak = 0;
      updates.longestWeeklyStreak = 0;
      updates.currentWeekDays = 0;
      updates.weekStartDate = new Date();
      features.push("weekly streaks");
      weeklyStreakInitialized++;
    }

    // Initialize partner shields if needed
    if (user.partnerShields === null || user.partnerShields === undefined) {
      updates.partnerShields = 2;
      updates.shieldsUsedThisMonth = [];
      updates.lastShieldReset = new Date();
      features.push("shields");
      shieldsInitialized++;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      console.log(
        `✅ ${user.email || user.name || user.id}: Initialized ${features.join(", ")}`
      );
    }
  }

  console.log("\n📊 Backfill Summary:");
  console.log(`   Rest days initialized: ${restDaysInitialized} users`);
  console.log(`   Weekly streaks initialized: ${weeklyStreakInitialized} users`);
  console.log(`   Partner shields initialized: ${shieldsInitialized} users`);
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
