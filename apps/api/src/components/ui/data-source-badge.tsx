"use client";

import { cn } from "@/lib/utils";
import type { FoodDataSource } from "@/types/food";

interface DataSourceBadgeProps {
  source: FoodDataSource | null | undefined;
  size?: "sm" | "default";
  className?: string;
}

const BADGE_CONFIG: Record<
  Exclude<FoodDataSource, "MANUAL">,
  { label: string; colors: string }
> = {
  FATSECRET: {
    label: "FS",
    colors: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  USDA: {
    label: "USDA",
    colors: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  OPEN_FOOD_FACTS: {
    label: "OFF",
    colors: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

export function DataSourceBadge({
  source,
  size = "sm",
  className,
}: DataSourceBadgeProps) {
  if (!source || source === "MANUAL") return null;

  const config = BADGE_CONFIG[source];
  if (!config) return null;

  const sizeClasses =
    size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5";

  return (
    <span
      className={cn(
        "rounded font-medium shrink-0",
        sizeClasses,
        config.colors,
        className
      )}
    >
      {config.label}
    </span>
  );
}
