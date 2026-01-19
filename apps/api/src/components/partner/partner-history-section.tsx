"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";
import { trpc } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { PartnerDayCard } from "./partner-day-card";

export function PartnerHistorySection() {
  const { data: history, isLoading } = trpc.stats.getPartnerHistory.useQuery({
    days: 7,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (!history) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold">{history.partnerName}&apos;s Recent Activity</h2>
      </div>

      <div className="space-y-2">
        {history.days.map((day, index) => (
          <PartnerDayCard
            key={day.date}
            date={day.date}
            totalCalories={day.totalCalories}
            totalProtein={day.totalProtein}
            totalCarbs={day.totalCarbs}
            totalFat={day.totalFat}
            calorieGoal={day.calorieGoal}
            entriesByMeal={day.entriesByMeal}
            delay={0.1 * index}
          />
        ))}
      </div>
    </motion.div>
  );
}
