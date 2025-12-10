"use client";

import { motion } from "framer-motion";
import { Plus, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnergyValue } from "@/components/ui/energy-value";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { FoodEntry } from "@prisma/client";
import { cn } from "@/lib/utils";

const mealConfig = {
  BREAKFAST: { icon: Coffee, label: "Breakfast", color: "text-chart-3" },
  LUNCH: { icon: Sun, label: "Lunch", color: "text-chart-1" },
  DINNER: { icon: Moon, label: "Dinner", color: "text-chart-2" },
  SNACK: { icon: Cookie, label: "Snacks", color: "text-chart-5" },
};

interface MealSectionProps {
  mealType: keyof typeof mealConfig;
  entries: FoodEntry[];
  delay?: number;
}

export function MealSection({ mealType, entries, delay = 0 }: MealSectionProps) {
  const config = mealConfig[mealType];
  const Icon = config.icon;
  // Only count approved entries toward total calories
  const totalCalories = entries
    .filter((e) => e.approvalStatus === "APPROVED")
    .reduce((sum, e) => sum + e.calories, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-muted ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{config.label}</h3>
            <p className="text-xs text-muted-foreground">
              {entries.length === 0
                ? "No items yet"
                : `${entries.length} item${entries.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EnergyValue
            kcal={totalCalories}
            toggleable
            className="text-sm font-semibold"
          />
          <Link href={`/log?meal=${mealType.toLowerCase()}`}>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
          {entries.slice(0, 3).map((entry) => {
            const isPending = entry.approvalStatus === "PENDING";
            return (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {entry.imageUrl && (
                    <img
                      src={entry.imageUrl}
                      alt={entry.name}
                      className={cn(
                        "w-8 h-8 rounded-lg object-cover",
                        isPending && "opacity-50"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "truncate",
                      isPending
                        ? "text-muted-foreground/60 italic"
                        : "text-muted-foreground"
                    )}
                  >
                    {entry.name}
                  </span>
                  {isPending && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                      Pending
                    </Badge>
                  )}
                </div>
                <EnergyValue
                  kcal={entry.calories}
                  className={cn(
                    "font-medium ml-2",
                    isPending && "text-muted-foreground/60"
                  )}
                />
              </div>
            );
          })}
          {entries.length > 3 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{entries.length - 3} more
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
