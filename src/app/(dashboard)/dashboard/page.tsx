"use client";

import { ProgressRing } from "@/components/dashboard/progress-ring";
import { DualProgressRing } from "@/components/dashboard/dual-progress-ring";
import { MacroCard } from "@/components/dashboard/macro-card";
import { MealSection } from "@/components/dashboard/meal-section";
import { PartnerCard } from "@/components/dashboard/partner-card";
import { PartnerDaySheet } from "@/components/partner/partner-day-sheet";
import { NotificationPermissionBanner } from "@/components/notifications/notification-permission-banner";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { JointCelebration, useJointCelebration } from "@/components/gamification/JointCelebration";
import { trpc } from "@/trpc/react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CalendarDays, Bell, RotateCcw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { calculateMacroTargets } from "@/lib/bmr";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [partnerSheetOpen, setPartnerSheetOpen] = useState(false);

  // Joint celebration hook
  const {
    showCelebration,
    setShowCelebration,
    checkAndShowCelebration,
  } = useJointCelebration();

  const { data: user } = trpc.auth.getMe.useQuery();

  const { data: summary, isLoading } = trpc.stats.getDailySummary.useQuery({
    date: format(selectedDate, "yyyy-MM-dd"),
  });

  const { data: partnerSummary } = trpc.stats.getPartnerDailySummary.useQuery({
    date: format(selectedDate, "yyyy-MM-dd"),
  });

  const { data: pendingCount } = trpc.food.getPendingApprovalCount.useQuery();

  const { data: streakData } = trpc.stats.getStreakData.useQuery();

  const { data: partnerStreakData } = trpc.stats.getPartnerStreakData.useQuery(undefined, {
    enabled: !!partnerSummary,
  });

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  // Check for joint celebration trigger (only on today's data)
  useEffect(() => {
    if (!isToday || !summary || !partnerSummary) return;

    const userOnGoal = summary.totalCalories > 0 && summary.totalCalories <= summary.calorieGoal;
    const partnerOnGoal =
      partnerSummary.totalCalories > 0 &&
      partnerSummary.totalCalories <= partnerSummary.calorieGoal;

    // Only trigger if both have logged something and are on goal
    if (userOnGoal && partnerOnGoal) {
      checkAndShowCelebration(userOnGoal, partnerOnGoal);
    }
  }, [summary, partnerSummary, isToday, checkAndShowCelebration]);

  const goToPrevDay = () => {
    setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000));
  };

  const goToNextDay = () => {
    if (!isToday) {
      setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const macroTargets = summary?.calorieGoal
    ? calculateMacroTargets(summary.calorieGoal)
    : { protein: 150, carbs: 200, fat: 65 };

  const hasPartner = !!partnerSummary;

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-[200px] w-[200px] rounded-full mx-auto" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 space-y-6 transition-colors duration-300",
      !isToday && "bg-amber-50/50 dark:bg-amber-950/30"
    )}>
      {/* Return to Today Banner (when viewing past dates) */}
      {!isToday && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={goToToday}
            variant="secondary"
            size="sm"
            className="w-full gap-2 bg-background/80 backdrop-blur-sm border border-amber-200 dark:border-amber-800"
          >
            <RotateCcw className="w-4 h-4" />
            Return to Today
          </Button>
        </motion.div>
      )}

      {/* Date Header with Streak */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevDay}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={goToToday}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <h1 className="text-lg font-semibold font-serif">
                {isToday ? "Today" : format(selectedDate, "EEE, MMM d")}
              </h1>
            </button>
            {streakData && streakData.currentStreak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full">
                <StreakCounter
                  currentStreak={streakData.currentStreak}
                  flameSize={streakData.flameSize}
                  streakFreezes={streakData.streakFreezes}
                  nextMilestone={streakData.nextMilestone}
                  milestoneProgress={streakData.milestoneProgress}
                  partnerStreak={partnerStreakData?.currentStreak}
                  showDuoMode={!!partnerStreakData}
                  compact
                />
              </div>
            )}
          </div>
          {!isToday && (
            <p className="text-xs text-muted-foreground">Viewing {format(selectedDate, "MMM d, yyyy")}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={isToday}
          className="rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Pending Approvals Banner */}
      {pendingCount && pendingCount.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/partner?tab=approvals">
            <Card className="bg-primary/10 border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {pendingCount.count} pending approval{pendingCount.count > 1 ? "s" : ""}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Notification Permission Banner */}
      <NotificationPermissionBanner />

      {/* Progress Ring - Dual when partner exists */}
      <motion.div
        className="flex justify-center py-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {partnerSummary ? (
          <DualProgressRing
            userProgress={{
              current: summary?.totalCalories ?? 0,
              goal: summary?.calorieGoal ?? 2000,
            }}
            partnerProgress={{
              current: partnerSummary.totalCalories,
              goal: partnerSummary.calorieGoal,
              name: partnerSummary.partnerName,
            }}
          />
        ) : (
          <ProgressRing
            current={summary?.totalCalories ?? 0}
            goal={summary?.calorieGoal ?? 2000}
          />
        )}
      </motion.div>

      {/* Setup Profile Reminder */}
      {!summary?.bmr && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 border-2 border-dashed border-primary/30 rounded-2xl p-5 text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Target className="w-7 h-7 text-primary" />
          </motion.div>
          <h3 className="font-semibold text-base mb-1">
            Calculate Your Calorie Goal
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set up your profile to get personalized daily targets
          </p>
          <Link href="/profile">
            <Button className="shadow-md">
              Complete Profile
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        <MacroCard
          label="Protein"
          current={summary?.totalProtein ?? 0}
          goal={macroTargets.protein}
          color="var(--chart-1)"
          delay={0.1}
        />
        <MacroCard
          label="Carbs"
          current={summary?.totalCarbs ?? 0}
          goal={macroTargets.carbs}
          color="var(--chart-3)"
          delay={0.2}
        />
        <MacroCard
          label="Fat"
          current={summary?.totalFat ?? 0}
          goal={macroTargets.fat}
          color="var(--chart-4)"
          delay={0.3}
        />
      </div>

      {/* Partner Progress */}
      {partnerSummary && (
        <>
          <PartnerCard
            partnerName={partnerSummary.partnerName}
            totalCalories={partnerSummary.totalCalories}
            calorieGoal={partnerSummary.calorieGoal}
            userCalories={summary?.totalCalories ?? 0}
            userGoal={summary?.calorieGoal ?? 2000}
            partnerLoggedToday={
              Object.values(partnerSummary.entriesByMeal).some(
                (entries) => entries.length > 0
              )
            }
            onClick={() => setPartnerSheetOpen(true)}
          />
          <PartnerDaySheet
            open={partnerSheetOpen}
            onOpenChange={setPartnerSheetOpen}
            partnerName={partnerSummary.partnerName}
            date={format(selectedDate, "yyyy-MM-dd")}
            totalCalories={partnerSummary.totalCalories}
            totalProtein={partnerSummary.totalProtein}
            totalCarbs={partnerSummary.totalCarbs}
            totalFat={partnerSummary.totalFat}
            calorieGoal={partnerSummary.calorieGoal}
            entriesByMeal={partnerSummary.entriesByMeal}
          />
        </>
      )}

      {/* Meals */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
          Meals
        </h2>
        <MealSection
          mealType="BREAKFAST"
          entries={summary?.entriesByMeal.BREAKFAST ?? []}
          delay={0.1}
          hasPartner={hasPartner}
          selectedDate={selectedDate}
          currentUserId={user?.id}
        />
        <MealSection
          mealType="LUNCH"
          entries={summary?.entriesByMeal.LUNCH ?? []}
          delay={0.2}
          hasPartner={hasPartner}
          selectedDate={selectedDate}
          currentUserId={user?.id}
        />
        <MealSection
          mealType="DINNER"
          entries={summary?.entriesByMeal.DINNER ?? []}
          delay={0.3}
          hasPartner={hasPartner}
          selectedDate={selectedDate}
          currentUserId={user?.id}
        />
        <MealSection
          mealType="SNACK"
          entries={summary?.entriesByMeal.SNACK ?? []}
          delay={0.4}
          hasPartner={hasPartner}
          selectedDate={selectedDate}
          currentUserId={user?.id}
        />
      </div>

      {/* Joint Celebration Dialog */}
      {partnerSummary && (
        <JointCelebration
          open={showCelebration}
          onOpenChange={setShowCelebration}
          userName={user?.name ?? "You"}
          partnerName={partnerSummary.partnerName}
        />
      )}
    </div>
  );
}
