"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { addDays, endOfWeek, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { Plus } from "lucide-react";
import { trpc } from "@/trpc/react";
import { DiaryCard } from "@/components/diary/diary-card";
import { Eyebrow } from "@/components/diary/eyebrow";
import { DiaryAvatar } from "@/components/diary/avatar";
import { CalorieRing } from "@/components/diary/calorie-ring";
import { WeekStrip } from "@/components/diary/week-strip";
import { cn } from "@/lib/utils";

type EntryData = {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  servingSize: number;
  servingUnit: string;
  loggedAt?: string | Date;
  consumedAt?: string | Date;
  imageUrl?: string | null;
};

function avatarInitial(me: { name?: string | null; email?: string | null } | null | undefined) {
  const source = me?.name?.trim() || me?.email || "?";
  return source.charAt(0).toUpperCase();
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const today = new Date();
  const isViewingToday = isSameDay(selectedDate, today);

  // Compute the week strip — Sunday-start week containing today
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const { data: me } = trpc.auth.getMe.useQuery();
  const { data: dailyData, isLoading } = trpc.stats.getDailySummary.useQuery(
    { date: dateStr },
    { refetchOnWindowFocus: true }
  );
  const { data: weekly } = trpc.stats.getWeeklySummary.useQuery(
    { endDate: weekEndStr },
    { refetchOnWindowFocus: true }
  );

  const daysWithEntries = useMemo(() => {
    const set = new Set<string>();
    weekly?.days.forEach((d) => {
      if (d.totalCalories > 0) {
        set.add(format(new Date(d.date), "yyyy-MM-dd"));
      }
    });
    return set;
  }, [weekly]);

  const entries = ((dailyData?.entries ?? []) as EntryData[]).slice().sort((a, b) => {
    const ta = new Date(a.consumedAt ?? a.loggedAt ?? 0).getTime();
    const tb = new Date(b.consumedAt ?? b.loggedAt ?? 0).getTime();
    return tb - ta; // newest first
  });

  const totalCalories = Math.round(dailyData?.totalCalories ?? 0);
  const goal = Math.round(dailyData?.calorieGoal ?? 2000);
  const remaining = goal - totalCalories;

  const subtitle =
    isLoading && !dailyData
      ? "Loading…"
      : entries.length === 0
        ? "Nothing logged."
        : `${entries.length} ${entries.length === 1 ? "moment" : "moments"} · ${totalCalories.toLocaleString()} kcal`;

  const dateLine = isViewingToday
    ? format(selectedDate, "EEE, MMM d")
    : `${format(selectedDate, "EEE, MMM d")} · Past`;

  const titleLine = isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE");

  return (
    <div className="mx-auto max-w-lg pb-24 animate-fade-in" aria-busy={isLoading && !dailyData}>
      {/* Header */}
      <div className="px-[22px] pt-3 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <Eyebrow>{dateLine}</Eyebrow>
          <h1 className="text-[42px] font-black text-[var(--text)] leading-none tracking-[-0.02em]">
            {titleLine}
          </h1>
          <p className="text-[15px] text-[var(--text-soft)] leading-snug">{subtitle}</p>
        </div>
        <DiaryAvatar initial={avatarInitial(me)} size={40} />
      </div>

      {/* Week strip */}
      <div className="px-[18px] pt-4">
        <WeekStrip
          days={weekDays}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          daysWithEntries={daysWithEntries}
        />
      </div>

      {/* Photo grid */}
      <div className="px-[18px] pt-5">
        <div className="grid grid-cols-3 gap-2">
          {isViewingToday && <AddCard />}
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      {/* Day summary */}
      {entries.length > 0 && (
        <div className="px-5 pt-6">
          <DiaryCard className="flex items-center gap-3.5">
            <CalorieRing consumed={totalCalories} budget={goal} size={60} stroke={6} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <Eyebrow>Day total</Eyebrow>
              <div className="leading-none">
                <span className="text-[22px] font-bold text-[var(--text)]">
                  {totalCalories.toLocaleString()}
                </span>{" "}
                <span className="text-[14px] font-semibold text-[var(--text-mute)]">
                  / {goal.toLocaleString()}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-soft)]">
                {remaining >= 0
                  ? `${remaining.toLocaleString()} kcal left`
                  : `over by ${Math.abs(remaining).toLocaleString()} kcal`}
              </p>
            </div>
          </DiaryCard>
        </div>
      )}
    </div>
  );
}

function AddCard() {
  return (
    <Link
      href="/add"
      aria-label="Add a food entry"
      className="relative block aspect-[0.72] overflow-hidden rounded-[14px] border border-dashed border-[color-mix(in_oklab,var(--primary)_45%,transparent)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] -rotate-[0.4deg] transition-transform active:scale-[0.97]"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--primary)] text-white"
          style={{ boxShadow: "0 6px 14px color-mix(in oklab, var(--primary) 40%, transparent)" }}
        >
          <Plus className="h-[22px] w-[22px]" strokeWidth={2.6} />
        </span>
      </div>
    </Link>
  );
}

function EntryCard({ entry }: { entry: EntryData }) {
  const ts = entry.consumedAt ?? entry.loggedAt;
  const time = ts ? format(new Date(ts), "HH:mm") : "";
  const kcal = Math.round(entry.calories);

  return (
    <Link
      href={`/food/edit/${entry.id}`}
      className="relative block aspect-[0.72] overflow-hidden rounded-[14px] shadow-diary border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] transition-transform active:scale-[0.97]"
    >
      {entry.imageUrl ? (
        <Image
          src={entry.imageUrl}
          alt={entry.name}
          fill
          sizes="(max-width: 512px) 33vw, 170px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
          <span
            className={cn(
              "text-[12px] font-semibold leading-tight text-[var(--text)]",
              "line-clamp-3"
            )}
          >
            {entry.name}
          </span>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[80px] bg-gradient-to-t from-black/55 to-transparent" />

      {/* Top-left time */}
      {time && (
        <span className="absolute left-2 top-2 font-mono text-[10px] font-bold text-white/95">
          {time}
        </span>
      )}

      {/* Bottom-left calorie + KCAL */}
      <div className="absolute bottom-2.5 left-2.5 flex items-end gap-[3px]">
        <span className="text-[22px] font-black leading-none text-white">{kcal}</span>
        <span className="pb-[3px] font-mono text-[8px] font-bold tracking-[0.1em] text-white/85">
          KCAL
        </span>
      </div>
    </Link>
  );
}
