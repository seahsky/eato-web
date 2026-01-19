"use client";

import { Coffee, Sun, Moon, Cookie } from "lucide-react";
import { EnergyValue } from "@/components/ui/energy-value";
import type { FoodEntry } from "@prisma/client";

const mealConfig = {
  BREAKFAST: { icon: Coffee, label: "Breakfast", color: "text-chart-3" },
  LUNCH: { icon: Sun, label: "Lunch", color: "text-chart-1" },
  DINNER: { icon: Moon, label: "Dinner", color: "text-chart-2" },
  SNACK: { icon: Cookie, label: "Snacks", color: "text-chart-5" },
};

interface PartnerMealSectionProps {
  mealType: keyof typeof mealConfig;
  entries: FoodEntry[];
}

export function PartnerMealSection({ mealType, entries }: PartnerMealSectionProps) {
  const config = mealConfig[mealType];
  const Icon = config.icon;
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-muted ${config.color}`}>
            <Icon className="w-3 h-3" />
          </div>
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <EnergyValue kcal={totalCalories} className="text-sm font-medium" />
      </div>
      <div className="space-y-1 pl-7">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between text-sm py-1"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {entry.imageUrl && (
                <img
                  src={entry.imageUrl}
                  alt={entry.name}
                  className="w-6 h-6 rounded object-cover"
                />
              )}
              <span className="truncate text-muted-foreground">{entry.name}</span>
            </div>
            <EnergyValue kcal={entry.calories} className="text-muted-foreground ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
