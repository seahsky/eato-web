"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, BookOpen } from "lucide-react";
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
  imageUrl?: string | null;
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
    <div className="mx-auto max-w-lg px-4 animate-fade-in" aria-busy={isLoading && !data}>
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

      {/* Loading skeleton */}
      {isLoading && !data && (
        <div className="space-y-1.5" role="status" aria-live="polite">
          <span className="sr-only">Loading diary entries...</span>
          {[0, 1, 2].map((i) => (
            <Card key={i} className={i < 3 ? `animate-fade-in-delay-${i}` : undefined}>
              <CardContent className="py-3">
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-muted animate-shimmer" />
                  <div className="flex justify-between">
                    <div className="h-4 w-32 rounded bg-muted animate-shimmer" />
                    <div className="h-4 w-16 rounded bg-muted animate-shimmer" />
                  </div>
                  <div className="h-3 w-24 rounded bg-muted animate-shimmer" />
                </div>
              </CardContent>
            </Card>
          ))}
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
            <div className="space-y-1.5 mb-16">
              {grouped.map((group) => {
                if (group.groupId && group.items.length > 1) {
                  // Meal group — cluster in a shared card
                  const groupImageUrl = group.items.find((e) => e.imageUrl)?.imageUrl;
                  return (
                    <div key={group.groupId} className="border-l-2 border-primary/20 pl-3 space-y-1.5">
                      {groupImageUrl && (
                        <div className="overflow-hidden rounded-md relative h-28 w-full">
                          <Image
                            src={groupImageUrl}
                            alt="Meal photo"
                            fill
                            className="object-cover"
                            sizes="(max-width: 512px) 100vw, 512px"
                          />
                        </div>
                      )}
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

              {/* Daily total */}
              {data.totalCalories > 0 && (
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {COPY.dailyTotal(data.totalCalories)}
                </p>
              )}
            </div>
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
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg animate-scale-in-delayed transition-[transform] duration-[var(--duration-instant)] hover:scale-105 active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Plus className="h-4 w-4" />
        {COPY.fab}
      </Link>
    </div>
  );
}
