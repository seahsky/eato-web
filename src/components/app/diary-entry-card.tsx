"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

interface DiaryEntry {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  servingSize: number;
  servingUnit: string;
  mealType?: string | null;
  consumedAt?: string | Date;
  loggedAt?: string | Date;
}

interface DiaryEntryCardProps {
  entry: DiaryEntry;
  showCalories?: boolean;
  onClick?: () => void;
}

export function DiaryEntryCard({
  entry,
  showCalories = true,
  onClick,
}: DiaryEntryCardProps) {
  const time = entry.loggedAt
    ? format(new Date(entry.loggedAt), "h:mm a")
    : null;
  const mealLabel = entry.mealType ? MEAL_LABELS[entry.mealType] : null;

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:bg-accent hover:shadow-warm-lg hover:-translate-y-0.5"
      )}
      onClick={onClick}
      {...(onClick ? { role: "button", "aria-label": `${entry.name}, ${Math.round(entry.calories)} calories` } : {})}
    >
      <CardContent className="py-3">
        {/* Time and meal type */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {time && <span>{time}</span>}
          {time && mealLabel && <span>&middot;</span>}
          {mealLabel && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
              {mealLabel}
            </Badge>
          )}
        </div>

        {/* Food name and calories */}
        <div className="mt-0.5 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{entry.name}</div>
            <div className="text-xs text-muted-foreground">
              {entry.servingSize}{entry.servingUnit}
              {entry.brand ? ` \u00b7 ${entry.brand}` : ""}
            </div>
          </div>
          {showCalories && (
            <span className="shrink-0 text-sm text-muted-foreground">
              ~{Math.round(entry.calories)} kcal
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
