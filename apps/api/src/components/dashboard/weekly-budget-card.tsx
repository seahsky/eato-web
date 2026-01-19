"use client";

import { motion } from "framer-motion";
import { Calendar, TrendingUp, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEnergyUnit } from "@/contexts/energy-context";
import { convertEnergy, getEnergyLabel } from "@/lib/energy";
import {
  getEnergyBalance,
  getEnergyBalanceColor,
  isOnTrack,
} from "@/lib/energy-balance";
import { formatWeekRange } from "@/lib/weekly-budget";
import { cn } from "@/lib/utils";

interface WeeklyBudgetCardProps {
  weeklyBudget: number;
  weeklyConsumed: number;
  weeklyRemaining: number;
  daysRemaining: number;
  suggestedDailyBudget: number;
  weekStartDate: Date;
  weekEndDate: Date;
}

export function WeeklyBudgetCard({
  weeklyBudget,
  weeklyConsumed,
  weeklyRemaining,
  daysRemaining,
  suggestedDailyBudget,
  weekStartDate,
  weekEndDate,
}: WeeklyBudgetCardProps) {
  const { energyUnit } = useEnergyUnit();

  const weeklyProgress = weeklyBudget > 0 ? Math.min((weeklyConsumed / weeklyBudget) * 100, 100) : 0;
  const weeklyBalance = getEnergyBalance(weeklyConsumed, weeklyBudget);
  const onTrack = isOnTrack(weeklyBalance);
  const progressColor = getEnergyBalanceColor(weeklyBalance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="rounded-2xl border border-border/50 bg-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Weekly Budget</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatWeekRange(weekStartDate, weekEndDate)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            {convertEnergy(weeklyConsumed, energyUnit).toLocaleString()}{" "}
            {getEnergyLabel(energyUnit)}
          </span>
          <span>
            {convertEnergy(weeklyBudget, energyUnit).toLocaleString()}{" "}
            {getEnergyLabel(energyUnit)}
          </span>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: progressColor }}
            initial={{ width: 0 }}
            animate={{ width: `${weeklyProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Days remaining */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Days left</p>
            <p className="text-sm font-semibold">
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
            </p>
          </div>
        </div>

        {/* Suggested daily */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
          <Target className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Suggested/day</p>
            <p className="text-sm font-semibold">
              {convertEnergy(suggestedDailyBudget, energyUnit).toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {getEnergyLabel(energyUnit)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Status message */}
      <p
        className={cn(
          "text-xs text-center mt-3 font-medium",
          onTrack ? "text-success" : "text-destructive"
        )}
      >
        {onTrack
          ? `${convertEnergy(weeklyRemaining, energyUnit).toLocaleString()} ${getEnergyLabel(energyUnit)} remaining this week`
          : `${convertEnergy(weeklyConsumed - weeklyBudget, energyUnit).toLocaleString()} ${getEnergyLabel(energyUnit)} over budget`}
      </p>
    </motion.div>
  );
}
