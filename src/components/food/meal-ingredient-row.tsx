"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodProduct } from "@/types/food";
import type { ParsedIngredient } from "@/lib/meal-parser";

export interface ResolvedMealIngredient extends ParsedIngredient {
  matchedProduct?: FoodProduct;
  alternatives?: FoodProduct[];
  calculatedCalories?: number;
}

interface MealIngredientRowProps {
  ingredient: ResolvedMealIngredient;
  index: number;
  isLoading?: boolean;
  onSwap: (ingredient: ResolvedMealIngredient) => void;
}

export function MealIngredientRow({
  ingredient,
  index,
  isLoading,
  onSwap,
}: MealIngredientRowProps) {
  const hasError = !!ingredient.parseError;
  const noMatch = !hasError && !ingredient.matchedProduct && !isLoading;

  // Calculate calories from per-100g values
  const calories = ingredient.matchedProduct
    ? Math.round(
        (ingredient.matchedProduct.caloriesPer100g * ingredient.normalizedGrams) / 100
      )
    : 0;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => !hasError && onSwap(ingredient)}
      disabled={hasError}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
        hasError
          ? "border-destructive/30 bg-destructive/5 cursor-not-allowed"
          : noMatch
            ? "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10"
            : "border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Original input line */}
          <p className="text-sm font-medium truncate">
            {ingredient.quantity}
            {ingredient.unit} {ingredient.ingredientName}
          </p>

          {/* Matched food or error state */}
          {hasError ? (
            <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" />
              {ingredient.parseError}
            </p>
          ) : isLoading ? (
            <p className="text-xs text-muted-foreground mt-0.5">Searching...</p>
          ) : noMatch ? (
            <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" />
              No match found - tap to search
            </p>
          ) : ingredient.matchedProduct ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {ingredient.matchedProduct.name}
              {ingredient.matchedProduct.brand && ` (${ingredient.matchedProduct.brand})`}
            </p>
          ) : null}
        </div>

        {/* Calories and swap indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {!hasError && ingredient.matchedProduct && (
            <span className="text-sm font-semibold tabular-nums">{calories} kcal</span>
          )}
          {!hasError && (
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </div>
    </motion.button>
  );
}
