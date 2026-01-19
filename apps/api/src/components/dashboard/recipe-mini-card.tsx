"use client";

import { motion } from "framer-motion";
import { Plus, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Recipe {
  id: string;
  name: string;
  imageUrl?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  yieldWeight: number;
  yieldUnit: string;
}

interface RecipeMiniCardProps {
  recipe: Recipe;
  onQuickLog: (recipeId: string) => void;
  className?: string;
}

export function RecipeMiniCard({ recipe, onQuickLog, className }: RecipeMiniCardProps) {
  // Calculate total recipe calories
  const totalCalories = Math.round((recipe.caloriesPer100g / 100) * recipe.yieldWeight);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex-shrink-0 w-32 bg-card rounded-xl border shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Image or placeholder */}
      <div className="h-16 bg-muted/50 relative overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 space-y-1">
        <p className="text-xs font-medium line-clamp-2 leading-tight min-h-[2rem]">
          {recipe.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {totalCalories} kcal total
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="w-full h-7 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onQuickLog(recipe.id);
          }}
        >
          <Plus className="w-3 h-3" />
          Log
        </Button>
      </div>
    </motion.div>
  );
}
