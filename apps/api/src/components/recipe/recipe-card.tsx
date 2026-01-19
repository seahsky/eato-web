"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EnergyValue } from "@/components/ui/energy-value";
import { ChefHat, Plus, Users } from "lucide-react";
import Link from "next/link";

interface RecipeCardProps {
  recipe: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    yieldWeight: number;
    yieldUnit: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g: number;
  };
  isOwner?: boolean;
  partnerName?: string | null;
  href?: string;
  onLog?: () => void;
  index?: number;
}

export function RecipeCard({
  recipe,
  isOwner = true,
  partnerName,
  href,
  onLog,
  index = 0,
}: RecipeCardProps) {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl p-4 border border-border/50 space-y-3 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-14 h-14 rounded-lg object-cover bg-muted"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{recipe.name}</p>
          {recipe.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {recipe.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-primary font-medium">
              <EnergyValue kcal={recipe.caloriesPer100g} /> / 100g
            </p>
            {!isOwner && partnerName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {partnerName}
              </span>
            )}
          </div>
        </div>
        {onLog && (
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shrink-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLog();
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Macro summary */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-muted/50 rounded-lg py-1.5">
          <p className="font-semibold">{Math.round(recipe.proteinPer100g)}g</p>
          <p className="text-muted-foreground">protein</p>
        </div>
        <div className="bg-muted/50 rounded-lg py-1.5">
          <p className="font-semibold">{Math.round(recipe.carbsPer100g)}g</p>
          <p className="text-muted-foreground">carbs</p>
        </div>
        <div className="bg-muted/50 rounded-lg py-1.5">
          <p className="font-semibold">{Math.round(recipe.fatPer100g)}g</p>
          <p className="text-muted-foreground">fat</p>
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
