"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/trpc/react";
import { DateNavigator } from "@/components/app/date-navigator";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data, isLoading, error } = trpc.stats.getDailySummary.useQuery(
    { date: dateStr },
    { refetchOnWindowFocus: true }
  );

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Date header */}
      <div className="pt-4 pb-1">
        <h1 className="font-caveat text-2xl text-foreground">
          {format(selectedDate, "EEEE, d MMMM")}
        </h1>
      </div>

      <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />

      {/* Calorie summary */}
      {data && (
        <p className="mt-2 mb-4 text-sm text-muted-foreground">
          Today so far: {Math.round(data.totalCalories)} kcal
          {data.calorieGoal ? ` / ${Math.round(data.calorieGoal)} kcal` : ""}
        </p>
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

      {/* Diary Entries */}
      {data && (
        <>
          {data.entries.length > 0 && (
            <div className="space-y-1.5">
              {(data.entries as Array<{
                id: string;
                name: string;
                brand?: string | null;
                calories: number;
                servingSize: number;
                servingUnit: string;
              }>).map((entry) => (
                <Link key={entry.id} href={`/food/edit/${entry.id}`}>
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="py-2.5">
                      <div className="text-sm font-medium">{entry.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>~{Math.round(entry.calories)} kcal</span>
                        <span>&middot;</span>
                        <span>
                          {entry.servingSize}{entry.servingUnit}
                          {entry.brand ? ` · ${entry.brand}` : ""}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Empty state */}
          {data.entries.length === 0 && !isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <h2 className="font-caveat text-xl text-foreground">
                  Your diary is empty today
                </h2>
                <p className="text-sm text-muted-foreground">
                  What&apos;s the first thing you ate?
                </p>
                <Button asChild size="sm">
                  <Link href="/search">Write it down</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Floating action button */}
      <Link
        href="/search"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
