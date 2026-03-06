"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { UtensilsCrossed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/trpc/react";
import { DateNavigator } from "@/components/app/date-navigator";
import { CalorieRing } from "@/components/app/calorie-ring";
import { MealSection } from "@/components/app/meal-section";
import { MacroBar } from "@/components/app/macro-bar";
import type { MealType } from "@/server/client-types";

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data, isLoading, error } = trpc.stats.getDailySummary.useQuery(
    { date: dateStr },
    { refetchOnWindowFocus: true }
  );

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <h1 className="text-lg font-bold">Eato</h1>
      </div>

      <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />

      {/* Calorie Ring */}
      {data && (
        <CalorieRing consumed={data.totalCalories} goal={data.calorieGoal} />
      )}

      {/* Macros */}
      {data && (
        <Card className="mb-4">
          <CardContent className="space-y-1.5 py-3">
            <MacroBar label="Protein" value={data.totalProtein} color="bg-blue-500" />
            <MacroBar label="Carbs" value={data.totalCarbs} color="bg-amber-500" />
            <MacroBar label="Fat" value={data.totalFat} color="bg-red-500" />
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && !data && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="py-3 text-sm text-destructive">
            {error.message}
          </CardContent>
        </Card>
      )}

      {/* Meal Sections */}
      {data && (
        <>
          {MEAL_TYPES.map((type) => (
            <MealSection
              key={type}
              mealType={type}
              entries={data.entriesByMeal[type] ?? []}
            />
          ))}

          {/* Empty state */}
          {data.entries.length === 0 && !isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No food logged yet today
                </p>
                <Button asChild size="sm">
                  <Link href="/add">Log Food</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
