"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, addDays, isYesterday } from "date-fns";

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

function formatDisplayDate(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <Button variant="ghost" size="icon" aria-label="Previous day" onClick={() => onDateChange(addDays(date, -1))}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <button
        key={formatDisplayDate(date)}
        className="animate-fade-in rounded-md px-3 py-1 text-sm font-medium transition-colors hover:bg-accent"
        style={{ animationDuration: 'var(--duration-fast)' }}
        aria-label="Go to today"
        onClick={() => onDateChange(new Date())}
      >
        {formatDisplayDate(date)}
      </button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next day"
        disabled={isToday(date)}
        onClick={() => onDateChange(addDays(date, 1))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
