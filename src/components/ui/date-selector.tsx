"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { format, subDays, isToday, isSameDay, startOfDay } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Maximum days in the past allowed (default: 30) */
  maxDaysBack?: number;
  className?: string;
}

export function DateSelector({
  value,
  onChange,
  maxDaysBack = 30,
  className,
}: DateSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const today = startOfDay(new Date());
  const minDate = subDays(today, maxDaysBack);

  const isBackdated = !isToday(value);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      // Parse YYYY-MM-DD as local date
      const [year, month, day] = dateValue.split("-").map(Number);
      const newDate = new Date(year, month - 1, day);
      onChange(newDate);
    }
  };

  const openPicker = () => {
    inputRef.current?.showPicker();
  };

  // Format for display
  const displayText = isToday(value)
    ? "Today"
    : format(value, "EEE, MMM d");

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant={isBackdated ? "secondary" : "ghost"}
        size="sm"
        onClick={openPicker}
        className={cn(
          "gap-2 font-normal",
          isBackdated && "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
        )}
      >
        <CalendarDays className="h-4 w-4" />
        {displayText}
      </Button>

      {/* Hidden native date input for mobile compatibility */}
      <input
        ref={inputRef}
        type="date"
        value={format(value, "yyyy-MM-dd")}
        onChange={handleDateChange}
        min={format(minDate, "yyyy-MM-dd")}
        max={format(today, "yyyy-MM-dd")}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        style={{ colorScheme: "light dark" }}
      />
    </div>
  );
}
