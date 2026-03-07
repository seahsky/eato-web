"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/trpc/react";
import { DateNavigator } from "@/components/app/date-navigator";
import { DiaryEntryCard } from "@/components/app/diary-entry-card";
import { EmptyState } from "@/components/app/empty-state";
import { COPY } from "@/lib/copy";

type EntryData = {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  servingSize: number;
  servingUnit: string;
  mealType?: string | null;
  loggedAt?: string | Date;
  consumedAt?: string | Date;
};

const MEAL_ORDER = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

function groupByMealType(entries: EntryData[]) {
  const groups = new Map<string, EntryData[]>();
  for (const entry of entries) {
    const key = entry.mealType ?? "OTHER";
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }
  // Sort groups by meal order
  const sorted: [string, EntryData[]][] = [];
  for (const meal of MEAL_ORDER) {
    const group = groups.get(meal);
    if (group) sorted.push([meal, group]);
  }
  const other = groups.get("OTHER");
  if (other) sorted.push(["OTHER", other]);
  return sorted;
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data, isLoading, error } = trpc.stats.getDailySummary.useQuery(
    { date: dateStr },
    { refetchOnWindowFocus: true }
  );

  const { data: weeklyBudget } = trpc.stats.getWeeklyBudgetStatus.useQuery(
    { date: dateStr },
    { refetchOnWindowFocus: true }
  );

  const entries = (data?.entries ?? []) as EntryData[];
  const grouped = groupByMealType(entries);
  const hasMealTypes = entries.some((e) => e.mealType);

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Date header */}
      <div className="pt-4 pb-1">
        <h1 className="font-caveat text-2xl text-foreground">
          {format(selectedDate, "EEEE, d MMMM")}
        </h1>
      </div>

      <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />

      {/* Weekly context line */}
      {weeklyBudget && (
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          {COPY.weeklyContext(
            weeklyBudget.daysInWeek - weeklyBudget.daysRemaining,
            weeklyBudget.weeklyConsumed,
            weeklyBudget.weeklyBudget
          )}
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
          {entries.length > 0 && (
            <div className="space-y-1.5">
              {hasMealTypes
                ? grouped.map(([, groupEntries]) =>
                    groupEntries.map((entry, i) => (
                      <div key={entry.id} className={i < 5 ? `animate-fade-in-delay-${i}` : "animate-fade-in-delay-4"}>
                        <Link href={`/food/edit/${entry.id}`}>
                          <DiaryEntryCard entry={entry} />
                        </Link>
                      </div>
                    ))
                  )
                : entries.map((entry, i) => (
                    <div key={entry.id} className={i < 5 ? `animate-fade-in-delay-${i}` : "animate-fade-in-delay-4"}>
                      <Link href={`/food/edit/${entry.id}`}>
                        <DiaryEntryCard entry={entry} />
                      </Link>
                    </div>
                  ))}
            </div>
          )}

          {/* Daily total */}
          {entries.length > 0 && data.totalCalories > 0 && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {COPY.dailyTotal(data.totalCalories)}
            </p>
          )}

          {/* Empty state */}
          {entries.length === 0 && !isLoading && (
            <EmptyState
              icon={<BookOpen className="h-10 w-10" />}
              title={COPY.emptyDiaryTitle}
              description={COPY.emptyDiaryDescription}
              action={
                <Button asChild size="sm">
                  <Link href="/search">{COPY.emptyDiaryCta}</Link>
                </Button>
              }
            />
          )}
        </>
      )}

      {/* Floating action button - warm pill */}
      <Link
        href="/search"
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        {COPY.fab}
      </Link>
    </div>
  );
}
