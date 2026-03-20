"use client";

import { memo } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DiaryEntry {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  servingSize: number;
  servingUnit: string;
  consumedAt?: string | Date;
  loggedAt?: string | Date;
  mood?: string | null;
  note?: string | null;
  imageUrl?: string | null;
}

interface DiaryEntryCardProps {
  entry: DiaryEntry;
  showCalories?: boolean;
  onClick?: () => void;
}

export const DiaryEntryCard = memo(function DiaryEntryCard({
  entry,
  showCalories = true,
  onClick,
}: DiaryEntryCardProps) {
  const time = entry.loggedAt
    ? format(new Date(entry.loggedAt), "h:mm a")
    : null;

  return (
    <Card
      className={cn(
        "transition-[background-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
        onClick && "cursor-pointer hover:bg-accent hover:shadow-warm-lg hover:-translate-y-0.5"
      )}
      onClick={onClick}
      {...(onClick ? {
        role: "button",
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
        "aria-label": `${entry.name}, ${Math.round(entry.calories)} calories${entry.mood ? `, mood: ${entry.mood}` : ""}${entry.note ? `, note: ${entry.note}` : ""}`,
      } : {})}
    >
      <CardContent className="py-3">
        {/* Photo */}
        {entry.imageUrl && (
          <div className="-mx-4 -mt-3 mb-2 overflow-hidden rounded-t-lg relative h-28">
            <Image
              src={entry.imageUrl}
              alt={entry.name ? `Photo of ${entry.name}` : "Food photo"}
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </div>
        )}

        {/* Time */}
        {time && (
          <div className="text-xs text-muted-foreground">
            {time}
          </div>
        )}

        {/* Food name and calories */}
        <div className="mt-0.5 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{entry.name}</div>
            <div className="text-xs text-muted-foreground">
              {entry.servingSize}{entry.servingUnit}
              {entry.brand ? ` \u00b7 ${entry.brand}` : ""}
            </div>
          </div>
          {showCalories && (
            <span className="shrink-0 text-sm text-muted-foreground">
              ~{Math.round(entry.calories)} kcal
            </span>
          )}
        </div>

        {/* Mood & note */}
        {(entry.mood || entry.note) && (
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            {entry.mood && <span>{entry.mood}</span>}
            {entry.note && <span className="italic line-clamp-2">{entry.note}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
