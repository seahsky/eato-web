"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight, UtensilsCrossed } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EnergyValue } from "@/components/ui/energy-value";
import { Badge } from "@/components/ui/badge";
import type { MealEstimationListItem } from "@/types/meal-estimation";

interface MealEstimationHistoryItemProps {
  estimation: MealEstimationListItem;
  index: number;
  onSelect: () => void;
}

export function MealEstimationHistoryItem({
  estimation,
  index,
  onSelect,
}: MealEstimationHistoryItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      layout
      onClick={onSelect}
      className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{estimation.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {estimation.ingredientCount} ingredient{estimation.ingredientCount !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(estimation.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <EnergyValue
              kcal={estimation.totalCalories}
              toggleable
              className="text-sm font-semibold"
            />
            {estimation.hasBeenLogged && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 mt-1">
                <Check className="w-2.5 h-2.5 mr-0.5" />
                Logged
              </Badge>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </motion.button>
  );
}
