"use client";

import { cn } from "@/lib/utils";
import type { MealType } from "@/server/client-types";

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "SNACK", label: "Snack" },
];

interface MealTypePillsProps {
  value: MealType | null;
  onChange: (value: MealType) => void;
}

export function MealTypePills({ value, onChange }: MealTypePillsProps) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Meal type">
      {MEAL_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={cn(
            "rounded-full px-3.5 py-2 text-sm font-medium transition-colors active:scale-95",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-transparent text-muted-foreground hover:bg-accent"
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
