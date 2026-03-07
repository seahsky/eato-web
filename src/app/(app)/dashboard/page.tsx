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
  mealGroupId?: string | null;
  loggedAt?: string | Date;
  consumedAt?: string | Date;
  mood?: string | null;
  note?: string | null;
};

/** Group entries by mealGroupId, preserving chronological order */
function groupEntries(entries: EntryData[]): { groupId: string | null; items: EntryData[] }[] {
  const groups: { groupId: string | null; items: EntryData[] }[] = [];
  const seenGroups = new Map<string, number>();

  for (const entry of entries) {
    const gid = entry.mealGroupId ?? null;
    if (gid && seenGroups.has(gid)) {
      groups[seenGroups.get(gid)!].items.push(entry);
    } else {
      const idx = groups.length;
      groups.push({ groupId: gid, items: [entry] });
      if (gid) seenGroups.set(gid, idx);
    }
  }
  return groups;
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
  const grouped = groupEntries(entries);

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
              {grouped.map((group) => {
                if (group.groupId && group.items.length > 1) {
                  // Meal group — cluster in a shared card
                  return (
                    <div key={group.groupId} className="rounded-lg border border-border/50 bg-muted/30 p-1.5 space-y-1">
                      {group.items.map((entry) => (
                        <Link key={entry.id} href={`/food/edit/${entry.id}`}>
                          <DiaryEntryCard entry={entry} />
                        </Link>
                      ))}
                    </div>
                  );
                }
                // Individual entries (no group or single-item group)
                return group.items.map((entry, i) => (
                  <div key={entry.id} className={i < 5 ? `animate-fade-in-delay-${i}` : "animate-fade-in-delay-4"}>
                    <Link href={`/food/edit/${entry.id}`}>
                      <DiaryEntryCard entry={entry} />
                    </Link>
                  </div>
                ));
              })}
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
                  <Link href="/log">{COPY.emptyDiaryCta}</Link>
                </Button>
              }
            />
          )}
        </>
      )}

      {/* Floating action button - warm pill */}
      <Link
        href="/log"
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        {COPY.fab}
      </Link>
    </div>
  );
}
