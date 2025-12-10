"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { EnergyValue } from "@/components/ui/energy-value";
import { PartnerMealSection } from "./partner-meal-section";
import type { FoodEntry } from "@prisma/client";
import { cn } from "@/lib/utils";

interface PartnerDayCardProps {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieGoal: number;
  entriesByMeal: {
    BREAKFAST: FoodEntry[];
    LUNCH: FoodEntry[];
    DINNER: FoodEntry[];
    SNACK: FoodEntry[];
  };
  delay?: number;
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

export function PartnerDayCard({
  date,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  calorieGoal,
  entriesByMeal,
  delay = 0,
}: PartnerDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const progress = Math.min((totalCalories / calorieGoal) * 100, 100);
  const isOnGoal = totalCalories <= calorieGoal;
  const hasEntries =
    entriesByMeal.BREAKFAST.length > 0 ||
    entriesByMeal.LUNCH.length > 0 ||
    entriesByMeal.DINNER.length > 0 ||
    entriesByMeal.SNACK.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden"
    >
      <button
        onClick={() => hasEntries && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full p-4 text-left",
          hasEntries && "cursor-pointer hover:bg-muted/30 transition-colors"
        )}
        disabled={!hasEntries}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{formatDateLabel(date)}</span>
          <div className="flex items-center gap-2">
            {totalCalories > 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                  isOnGoal
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {isOnGoal ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                <span>{isOnGoal ? "On goal" : "Over"}</span>
              </div>
            )}
            {hasEntries && (
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            <EnergyValue kcal={totalCalories} className="font-semibold text-foreground" />
            {" / "}
            <EnergyValue kcal={calorieGoal} />
          </span>
        </div>

        <Progress value={progress} className="h-1.5" />

        {!hasEntries && totalCalories === 0 && (
          <p className="text-xs text-muted-foreground mt-2">No entries</p>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && hasEntries && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50">
              <PartnerMealSection mealType="BREAKFAST" entries={entriesByMeal.BREAKFAST} />
              <PartnerMealSection mealType="LUNCH" entries={entriesByMeal.LUNCH} />
              <PartnerMealSection mealType="DINNER" entries={entriesByMeal.DINNER} />
              <PartnerMealSection mealType="SNACK" entries={entriesByMeal.SNACK} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
