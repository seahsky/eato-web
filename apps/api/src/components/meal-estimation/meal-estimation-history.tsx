"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/react";
import { MealEstimationHistoryItem } from "./meal-estimation-history-item";
import { MealEstimationEditSheet } from "./meal-estimation-edit-sheet";
import type { MealEstimationListItem } from "@/types/meal-estimation";

interface MealEstimationHistoryProps {
  onLoadEstimation?: (estimation: {
    rawInputText: string;
    ingredients: Array<{
      id: string;
      rawLine: string;
      ingredientName: string;
      quantity: number;
      unit: string;
      normalizedGrams: number;
      matchedProductId: string | null;
      matchedProductName: string | null;
      matchedProductBrand: string | null;
      dataSource: "OPEN_FOOD_FACTS" | "USDA" | "MANUAL" | null;
      caloriesPer100g: number | null;
      proteinPer100g: number | null;
      carbsPer100g: number | null;
      fatPer100g: number | null;
      hasMatch: boolean;
      parseError: string | null;
    }>;
  }) => void;
}

export function MealEstimationHistory({ onLoadEstimation }: MealEstimationHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = trpc.mealEstimation.list.useQuery(
    { limit: 20 },
    { staleTime: 30000 }
  );

  const estimations = data?.items ?? [];
  const displayedEstimations = isExpanded ? estimations : estimations.slice(0, 3);
  const hasMore = estimations.length > 3;

  if (isLoading) {
    return (
      <div className="space-y-2 mt-6 pt-4 border-t">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Recent Estimations</span>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (estimations.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mt-6 pt-4 border-t"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Recent Estimations
            </span>
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  Show less <ChevronUp className="w-3 h-3 ml-1" />
                </>
              ) : (
                <>
                  +{estimations.length - 3} more <ChevronDown className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {displayedEstimations.map((estimation, index) => (
            <MealEstimationHistoryItem
              key={estimation.id}
              estimation={estimation}
              index={index}
              onSelect={() => setSelectedId(estimation.id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <MealEstimationEditSheet
        estimationId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onLoadToCalculator={onLoadEstimation}
      />
    </>
  );
}
