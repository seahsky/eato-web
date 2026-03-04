"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { MealType } from "@/server/client-types";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

const MEAL_ICONS: Record<MealType, string> = {
  BREAKFAST: "🌅",
  LUNCH: "☀️",
  DINNER: "🌙",
  SNACK: "🍿",
};

interface FoodEntryData {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  servingSize: number;
  servingUnit: string;
}

interface MealSectionProps {
  mealType: MealType;
  entries: FoodEntryData[];
}

export function MealSection({ mealType, entries }: MealSectionProps) {
  const totalCals = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">
          {MEAL_ICONS[mealType]} {MEAL_LABELS[mealType]}
        </h3>
        {entries.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {Math.round(totalCals)} kcal
          </span>
        )}
      </div>
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-3 text-center text-sm text-muted-foreground">
            No entries
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <Link key={entry.id} href={`/food/edit/${entry.id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.servingSize}{entry.servingUnit}
                      {entry.brand ? ` · ${entry.brand}` : ""}
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(entry.calories)} kcal
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
