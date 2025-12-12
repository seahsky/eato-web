"use client";

import { motion } from "framer-motion";
import { AlertCircle, Minus, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MealEstimationIngredient } from "@/types/meal-estimation";

interface MealEstimationIngredientRowProps {
  ingredient: MealEstimationIngredient;
  index: number;
  onQuantityChange: (id: string, newQuantity: number) => void;
  onSwap: (ingredient: MealEstimationIngredient) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function MealEstimationIngredientRow({
  ingredient,
  index,
  onQuantityChange,
  onSwap,
  onRemove,
  disabled,
}: MealEstimationIngredientRowProps) {
  const hasError = !!ingredient.parseError;
  const noMatch = !hasError && !ingredient.hasMatch;

  const adjustQuantity = (delta: number) => {
    const newQuantity = Math.max(1, ingredient.quantity + delta);
    onQuantityChange(ingredient.id, newQuantity);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border",
        hasError
          ? "border-destructive/30 bg-destructive/5"
          : noMatch
            ? "border-yellow-500/30 bg-yellow-500/5"
            : "border-border"
      )}
    >
      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() => adjustQuantity(-10)}
          disabled={disabled || ingredient.quantity <= 10}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          type="number"
          value={ingredient.quantity}
          onChange={(e) => onQuantityChange(ingredient.id, Number(e.target.value) || 1)}
          className="w-16 h-7 text-center text-sm px-1"
          min={1}
          disabled={disabled}
        />
        <span className="text-xs text-muted-foreground w-4">{ingredient.unit}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() => adjustQuantity(10)}
          disabled={disabled}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Ingredient info */}
      <button
        type="button"
        onClick={() => !hasError && onSwap(ingredient)}
        disabled={disabled || hasError}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-sm font-medium truncate">{ingredient.ingredientName}</p>
        {hasError ? (
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" />
            {ingredient.parseError}
          </p>
        ) : noMatch ? (
          <p className="text-[10px] text-yellow-600 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" />
            No match - tap to search
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground truncate">
            {ingredient.matchedProductName}
            {ingredient.matchedProductBrand && ` (${ingredient.matchedProductBrand})`}
          </p>
        )}
      </button>

      {/* Calories */}
      <div className="text-right shrink-0 w-14">
        <p className="text-sm font-semibold tabular-nums">
          {Math.round(ingredient.calories)}
        </p>
        <p className="text-[9px] text-muted-foreground">kcal</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!hasError && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onSwap(ingredient)}
            disabled={disabled}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onRemove(ingredient.id)}
          disabled={disabled}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
