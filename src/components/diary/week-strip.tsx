"use client";

import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

export function WeekStrip({
  days,
  selectedDate,
  onSelect,
  daysWithEntries,
}: {
  /** Array of 7 dates representing the week (left → right). */
  days: Date[];
  selectedDate: Date;
  onSelect: (date: Date) => void;
  /** Set of `yyyy-MM-dd` strings for days that have entries. */
  daysWithEntries: Set<string>;
}) {
  return (
    <div className="flex gap-1" role="tablist" aria-label="Days of week">
      {days.map((d) => {
        const isSelected = isSameDay(d, selectedDate);
        const key = format(d, "yyyy-MM-dd");
        const logged = daysWithEntries.has(key);
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={format(d, "EEEE, MMMM d")}
            onClick={() => onSelect(d)}
            className={cn(
              "flex-1 rounded-[12px] py-1.5 transition-colors active:scale-[0.97]",
              isSelected
                ? "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]"
                : "bg-transparent"
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
                  isSelected ? "text-[var(--primary)]" : "text-[var(--text-mute)]"
                )}
              >
                {format(d, "EEEEE")}
              </span>
              <span
                className={cn(
                  "text-[13px] font-bold leading-none",
                  isSelected ? "text-[var(--primary)]" : "text-[var(--text)]"
                )}
              >
                {format(d, "d")}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-1 w-1 rounded-full",
                  logged ? "bg-[var(--primary)]" : "bg-transparent"
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
