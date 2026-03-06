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
      <Button variant="ghost" size="icon" onClick={() => onDateChange(addDays(date, -1))}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <button
        className="text-sm font-medium"
        onClick={() => onDateChange(new Date())}
      >
        {formatDisplayDate(date)}
      </button>
      <Button
        variant="ghost"
        size="icon"
        disabled={isToday(date)}
        onClick={() => onDateChange(addDays(date, 1))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
