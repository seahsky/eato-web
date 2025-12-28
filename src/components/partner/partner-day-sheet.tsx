"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { EnergyValue } from "@/components/ui/energy-value";
import { MacroCard } from "@/components/dashboard/macro-card";
import { calculateMacroTargets } from "@/lib/bmr";
import { PartnerMealSection } from "./partner-meal-section";
import { Heart, Check, X } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { FoodEntry } from "@prisma/client";

interface PartnerDaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerName: string;
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
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

export function PartnerDaySheet({
  open,
  onOpenChange,
  partnerName,
  date,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  calorieGoal,
  entriesByMeal,
}: PartnerDaySheetProps) {
  const progress = Math.min((totalCalories / calorieGoal) * 100, 100);
  const isOnGoal = totalCalories <= calorieGoal;
  const hasEntries =
    entriesByMeal.BREAKFAST.length > 0 ||
    entriesByMeal.LUNCH.length > 0 ||
    entriesByMeal.DINNER.length > 0 ||
    entriesByMeal.SNACK.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-serif flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            {partnerName}&apos;s {formatDateLabel(date)}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {/* Calorie Summary */}
          <div className="bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-xl p-4 border border-secondary/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Daily Progress</span>
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
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <EnergyValue kcal={totalCalories} className="text-2xl font-bold" />
              <span className="text-muted-foreground">/</span>
              <EnergyValue kcal={calorieGoal} className="text-muted-foreground" />
            </div>

            <Progress value={progress} className="h-2" />
          </div>

          {/* Macro Summary with Progress */}
          {(() => {
            const macroTargets = calculateMacroTargets(calorieGoal);
            return (
              <div className="grid grid-cols-3 gap-3">
                <MacroCard
                  label="Protein"
                  current={totalProtein}
                  goal={macroTargets.protein}
                  color="var(--chart-1)"
                  delay={0}
                />
                <MacroCard
                  label="Carbs"
                  current={totalCarbs}
                  goal={macroTargets.carbs}
                  color="var(--chart-3)"
                  delay={0}
                />
                <MacroCard
                  label="Fat"
                  current={totalFat}
                  goal={macroTargets.fat}
                  color="var(--chart-4)"
                  delay={0}
                />
              </div>
            );
          })()}

          {/* Meals Section */}
          {hasEntries ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1 pt-2">
                Meals
              </h3>
              <div className="bg-card rounded-xl border border-border/50 p-3">
                <PartnerMealSection mealType="BREAKFAST" entries={entriesByMeal.BREAKFAST} />
                <PartnerMealSection mealType="LUNCH" entries={entriesByMeal.LUNCH} />
                <PartnerMealSection mealType="DINNER" entries={entriesByMeal.DINNER} />
                <PartnerMealSection mealType="SNACK" entries={entriesByMeal.SNACK} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No meals logged yet</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
