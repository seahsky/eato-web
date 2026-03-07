"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subMonths,
  addMonths,
  isSameDay,
  isSameMonth,
  isToday,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/trpc/react";
import { DiaryEntryCard } from "@/components/app/diary-entry-card";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

type HistoryEntry = {
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

export default function HistoryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch weekly summary for the visible month (4-5 weeks)
  const monthEndStr = format(endOfMonth(currentMonth), "yyyy-MM-dd");
  const { data: weeklyData, isLoading } = trpc.stats.getWeeklySummary.useQuery(
    { endDate: monthEndStr },
    { refetchOnWindowFocus: true }
  );

  // Fetch selected day's entries
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const { data: dayData } = trpc.stats.getDailySummary.useQuery(
    { date: selectedDateStr },
    { enabled: !!selectedDate }
  );

  // Build set of dates with data
  const datesWithData = useMemo(() => {
    if (!weeklyData) return new Set<string>();
    const dates = new Set<string>();
    for (const day of weeklyData.days) {
      if (day.totalCalories > 0) {
        dates.add(format(day.date, "yyyy-MM-dd"));
      }
    }
    return dates;
  }, [weeklyData]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Recent weeks for list view
  const recentWeeks = useMemo(() => {
    const weeks: { start: Date; end: Date; endStr: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const end = subDays(today, i * 7);
      const start = subDays(end, 6);
      weeks.push({
        start,
        end,
        endStr: format(end, "yyyy-MM-dd"),
      });
    }
    return weeks;
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4">
      <div className="py-3">
        <h1 className="font-caveat text-xl text-foreground">{COPY.historyHeading}</h1>
      </div>

      {/* Monthly calendar */}
      <Card className="mb-4">
        <CardContent className="py-3">
          {/* Month navigation */}
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              disabled={isSameMonth(currentMonth, new Date())}
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day labels */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d} className="text-[10px] font-medium text-muted-foreground">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const hasData = datesWithData.has(dateKey);
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);

              return (
                <button
                  key={dateKey}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md py-1.5 text-xs transition-colors",
                    !inMonth && "opacity-30",
                    isSelected && "bg-primary text-primary-foreground",
                    isTodayDay && !isSelected && "font-bold text-primary"
                  )}
                  onClick={() => setSelectedDate(isSameDay(day, selectedDate ?? new Date(0)) ? null : day)}
                >
                  <span>{format(day, "d")}</span>
                  {hasData && !isSelected && (
                    <span className="h-1 w-1 rounded-full bg-primary" />
                  )}
                  {hasData && isSelected && (
                    <span className="h-1 w-1 rounded-full bg-primary-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day entries */}
      {selectedDate && dayData && (
        <div className="mb-4 space-y-1.5">
          <h3 className="text-sm font-medium text-muted-foreground">
            {format(selectedDate, "EEEE, MMMM d")}
            {dayData.totalCalories > 0 && (
              <span> &middot; {Math.round(dayData.totalCalories)} kcal</span>
            )}
          </h3>
          {(dayData.entries as HistoryEntry[]).length > 0 ? (
            (dayData.entries as HistoryEntry[]).map((entry) => (
              <Link key={entry.id} href={`/food/edit/${entry.id}`}>
                <DiaryEntryCard entry={entry} />
              </Link>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No entries this day
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Recent weekly sections */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Recent weeks</h3>
        {recentWeeks.map((week) => (
          <WeekSection key={week.endStr} start={week.start} end={week.end} endStr={week.endStr} />
        ))}
      </div>
    </div>
  );
}

function WeekSection({ start, end, endStr }: { start: Date; end: Date; endStr: string }) {
  const [expanded, setExpanded] = useState(false);

  const { data } = trpc.stats.getWeeklySummary.useQuery(
    { endDate: endStr },
    { refetchOnWindowFocus: false }
  );

  if (!data) return null;

  const totalCalories = data.totalCalories;
  const entryCount = data.days.filter((d) => d.totalCalories > 0).length;

  if (totalCalories === 0) return null;

  return (
    <Card>
      <CardContent className="py-3">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div>
            <div className="text-sm font-medium">
              {format(start, "MMM d")} \u2013 {format(end, "MMM d")}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(totalCalories).toLocaleString()} kcal &middot; {entryCount} day{entryCount !== 1 ? "s" : ""} logged
            </div>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {data.days.map((day) => {
              if (day.totalCalories === 0) return null;
              return (
                <div key={format(day.date, "yyyy-MM-dd")} className="border-t pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(day.date, "EEEE, MMM d")}</span>
                    <span>{Math.round(day.totalCalories)} kcal</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
