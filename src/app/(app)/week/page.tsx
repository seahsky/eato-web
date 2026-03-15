"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format, addDays, isToday, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { CalorieRing } from "@/components/app/calorie-ring";
import { DiaryEntryCard } from "@/components/app/diary-entry-card";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

type DayEntry = {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  servingSize: number;
  servingUnit: string;
  loggedAt?: string | Date;
  consumedAt?: string | Date;
  mood?: string | null;
  note?: string | null;
};

export default function WeekPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Calculate week start based on offset
  const weekStart = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 0 });
    return addDays(start, weekOffset * 7);
  }, [weekOffset]);

  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${format(weekStart, "MMM d")} \u2013 ${format(weekEnd, "MMM d")}`;

  // Use the end-of-week date for API call (it expects the last day of the 7-day window)
  const endDateStr = format(weekEnd, "yyyy-MM-dd");

  const { data: budgetData, isLoading: budgetLoading } =
    trpc.stats.getWeeklyBudgetStatus.useQuery(
      { date: format(weekStart, "yyyy-MM-dd") },
      { refetchOnWindowFocus: true }
    );

  const { data: weeklyData, isLoading: weeklyLoading } =
    trpc.stats.getWeeklySummary.useQuery(
      { endDate: endDateStr },
      { refetchOnWindowFocus: true }
    );

  // Fetch entries for expanded day
  const expandedDateStr = expandedDay !== null
    ? format(addDays(weekStart, expandedDay), "yyyy-MM-dd")
    : "";
  const { data: dayData } = trpc.stats.getDailySummary.useQuery(
    { date: expandedDateStr },
    { enabled: expandedDay !== null && expandedDateStr !== "" }
  );

  const isOver = budgetData ? budgetData.weeklyConsumed > budgetData.weeklyBudget : false;
  const weeklyRemaining = budgetData ? Math.max(0, budgetData.weeklyBudget - budgetData.weeklyConsumed) : 0;
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="mx-auto max-w-lg px-4 animate-fade-in">
      {/* Header with navigation */}
      <div className="flex items-center justify-between py-3">
        <Button variant="ghost" size="icon" aria-label="Previous week" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h1 className="font-caveat text-xl text-foreground">{COPY.weekHeading}</h1>
          <p className="text-xs text-muted-foreground">{weekLabel}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next week"
          disabled={isCurrentWeek}
          onClick={() => setWeekOffset((o) => o + 1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Budget ring */}
      {budgetLoading && !budgetData && (
        <div className="flex justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Loading weekly budget...</span>
        </div>
      )}

      {budgetData && (
        <div className="animate-fade-in">
          <CalorieRing
            consumed={budgetData.weeklyConsumed}
            budget={budgetData.weeklyBudget}
            weekLabel={weekLabel}
          />
          {!isOver && weeklyRemaining > 0 && (
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {COPY.weekRemainingLabel(weeklyRemaining)}
            </p>
          )}
          {isOver && (
            <p className="mt-2 text-center text-xs text-muted-foreground italic">
              {COPY.weekOverBudget}
            </p>
          )}
        </div>
      )}

      {/* 7-day strip */}
      {weeklyData && (
        <div className="mt-6 grid grid-cols-7 gap-1">
          {weeklyData.days.map((day, i) => {
            const dayDate = addDays(weekStart, i);
            const hasData = day.totalCalories > 0;
            const isTodayDay = isToday(dayDate);
            const isExpanded = expandedDay === i;

            return (
              <button
                key={i}
                aria-label={`${format(dayDate, "EEEE, MMMM d")}${hasData ? `, ${Math.round(day.totalCalories)} calories` : ", no entries"}`}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg min-h-[44px] py-2.5 text-xs shadow-warm-sm transition-[color,background-color,transform] duration-[var(--duration-fast)] active:scale-[0.97]",
                  isExpanded && "bg-accent",
                  isTodayDay && !isExpanded && "ring-1 ring-primary/40",
                  !hasData && "opacity-50"
                )}
                onClick={() => setExpandedDay(isExpanded ? null : i)}
              >
                <span className="font-medium text-muted-foreground">
                  {format(dayDate, "EEE")}
                </span>
                <span className={cn("font-semibold", hasData ? "text-foreground" : "text-muted-foreground")}>
                  {hasData ? Math.round(day.totalCalories) : "\u2014"}
                </span>
                {hasData && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded day entries */}
      <div
        className="grid transition-[grid-template-rows] duration-[var(--duration-normal)] ease-[var(--ease-out-expo)]"
        style={{ gridTemplateRows: expandedDay !== null && dayData ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {expandedDay !== null && dayData && (
            <div className="mt-4 animate-fade-in space-y-1.5">
              <h2 className="text-sm font-medium text-muted-foreground">
                {format(addDays(weekStart, expandedDay), "EEEE, MMM d")}
              </h2>
              {(dayData.entries as DayEntry[]).length > 0 ? (
                (dayData.entries as DayEntry[]).map((entry, i) => (
                  <div key={entry.id} className={i < 5 ? `animate-fade-in-delay-${i}` : "animate-fade-in-delay-4"}>
                    <Link href={`/food/edit/${entry.id}`}>
                      <DiaryEntryCard entry={entry} />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {COPY.noEntriesDay}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {weeklyLoading && !weeklyData && (
        <div className="flex justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Loading weekly data...</span>
        </div>
      )}
    </div>
  );
}
