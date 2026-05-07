"use client";

import { useMemo } from "react";
import { addDays, endOfWeek, format, isSameDay, startOfWeek } from "date-fns";
import { trpc } from "@/trpc/react";
import { DiaryCard } from "@/components/diary/diary-card";
import { Eyebrow } from "@/components/diary/eyebrow";
import { cn } from "@/lib/utils";

export default function WeekPage() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const endDateStr = format(weekEnd, "yyyy-MM-dd");

  const { data, isLoading } = trpc.stats.getWeeklySummary.useQuery(
    { endDate: endDateStr },
    { refetchOnWindowFocus: true }
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const values = useMemo(() => {
    return days.map((d, i) => {
      const summaryDay = data?.days[i];
      const total = summaryDay ? Math.round(summaryDay.totalCalories) : 0;
      const goalMet = summaryDay?.goalMet ?? false;
      return { date: d, total, goalMet, letter: format(d, "EEEEE") };
    });
  }, [data, days]);

  const weekTotal = values.reduce((s, v) => s + v.total, 0);
  const daysLogged = values.filter((v) => v.total > 0).length;
  const maxDay = Math.max(1, ...values.map((v) => v.total));
  const avg = daysLogged > 0 ? Math.round(weekTotal / daysLogged) : 0;
  const metCount = values.filter((v) => v.goalMet && v.total > 0).length;

  const dateRange = `${format(weekStart, "MMM d")} – ${format(weekEnd, "d")} · This week`;

  return (
    <div className="mx-auto max-w-lg pb-24 animate-fade-in" aria-busy={isLoading && !data}>
      {/* Header */}
      <div className="px-[22px] pt-3 flex flex-col gap-1.5">
        <Eyebrow>{dateRange}</Eyebrow>
        <h1 className="text-[28px] font-bold text-[var(--text)] leading-none tracking-[-0.01em]">
          Your week
        </h1>
        <p className="text-[15px] text-[var(--text-soft)]">
          {daysLogged} {daysLogged === 1 ? "day" : "days"} logged · {weekTotal.toLocaleString()} kcal total
        </p>
      </div>

      {/* Bar chart */}
      <div className="px-5 pt-5">
        <DiaryCard className="p-4">
          <div className="flex h-[160px] items-end gap-2">
            {values.map((v) => {
              const isToday = isSameDay(v.date, today);
              const heightPx = v.total > 0 ? Math.max(4, (v.total / maxDay) * 140) : 2;
              return (
                <div key={v.letter + format(v.date, "yyyy-MM-dd")} className="flex flex-1 flex-col items-center gap-1.5 justify-end">
                  <div
                    className={cn(
                      "w-full rounded-[8px] transition-[height] duration-[var(--duration-slow)] ease-[var(--ease-out-expo)]",
                      isToday
                        ? "bg-[var(--primary)]"
                        : "bg-[color-mix(in_oklab,var(--primary)_35%,transparent)]"
                    )}
                    style={{ height: heightPx }}
                    aria-label={`${format(v.date, "EEEE")}: ${v.total.toLocaleString()} kcal`}
                  />
                  <span
                    className={cn(
                      "font-mono text-[9px] font-bold",
                      isToday ? "text-[var(--primary)]" : "text-[var(--text-mute)]"
                    )}
                  >
                    {v.letter}
                  </span>
                </div>
              );
            })}
          </div>
        </DiaryCard>
      </div>

      {/* Stat tiles */}
      <div className="px-5 pt-3 grid grid-cols-2 gap-2.5">
        <StatTile label="Daily avg" value={avg.toLocaleString()} sub="kcal per day" />
        <StatTile label="Goal met" value={`${metCount}/7`} sub="days on target" />
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <DiaryCard className="p-3.5">
      <div className="flex flex-col gap-0.5">
        <Eyebrow>{label}</Eyebrow>
        <span className="text-[24px] font-bold leading-tight text-[var(--text)]">{value}</span>
        <span className="text-[12px] text-[var(--text-soft)]">{sub}</span>
      </div>
    </DiaryCard>
  );
}
