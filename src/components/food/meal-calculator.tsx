"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { parseIngredientLines } from "@/lib/meal-parser";
import { trpc } from "@/trpc/react";
import { MealIngredientRow, type ResolvedMealIngredient } from "./meal-ingredient-row";
import { MealSwapSheet } from "./meal-swap-sheet";
import type { FoodProduct } from "@/types/food";

const PLACEHOLDER = `Enter ingredients, one per line:

200g flour
130g egg
100g olive oil
30g honey`;

export function MealCalculator() {
  const [inputText, setInputText] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [resolvedIngredients, setResolvedIngredients] = useState<ResolvedMealIngredient[]>([]);
  const [swapIngredient, setSwapIngredient] = useState<ResolvedMealIngredient | null>(null);

  // Parse input into structured ingredients
  const parsedIngredients = useMemo(() => {
    if (!inputText.trim()) return [];
    return parseIngredientLines(inputText);
  }, [inputText]);

  // Count valid ingredients (no parse errors)
  const validIngredients = parsedIngredients.filter((ing) => !ing.parseError);

  // Batch search query
  const batchSearchQuery = trpc.food.batchSearch.useQuery(
    {
      queries: validIngredients.map((ing) => ({
        id: ing.id,
        query: ing.ingredientName,
      })),
    },
    {
      enabled: false, // Manual trigger
    }
  );

  // Calculate button handler
  const handleCalculate = useCallback(async () => {
    if (validIngredients.length === 0) return;

    setIsEditing(false);

    // Trigger the batch search
    const result = await batchSearchQuery.refetch();

    if (result.data) {
      // Merge search results with parsed ingredients
      const resolved: ResolvedMealIngredient[] = parsedIngredients.map((ing) => {
        if (ing.parseError) {
          return ing;
        }

        const searchResult = result.data.find((r) => r.id === ing.id);
        const matchedProduct = searchResult?.products[0];
        const alternatives = searchResult?.products.slice(1);

        return {
          ...ing,
          matchedProduct,
          alternatives,
        };
      });

      setResolvedIngredients(resolved);
    }
  }, [validIngredients, parsedIngredients, batchSearchQuery]);

  // Handle swap selection
  const handleSwapSelect = useCallback(
    (ingredient: ResolvedMealIngredient, newProduct: FoodProduct) => {
      setResolvedIngredients((prev) =>
        prev.map((ing) =>
          ing.id === ingredient.id
            ? { ...ing, matchedProduct: newProduct }
            : ing
        )
      );
    },
    []
  );

  // Calculate total nutrition
  const totalNutrition = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    for (const ing of resolvedIngredients) {
      if (ing.matchedProduct) {
        const ratio = ing.normalizedGrams / 100;
        totals.calories += ing.matchedProduct.caloriesPer100g * ratio;
        totals.protein += ing.matchedProduct.proteinPer100g * ratio;
        totals.carbs += ing.matchedProduct.carbsPer100g * ratio;
        totals.fat += ing.matchedProduct.fatPer100g * ratio;
      }
    }

    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
    };
  }, [resolvedIngredients]);

  // Count matched ingredients
  const matchedCount = resolvedIngredients.filter((ing) => ing.matchedProduct).length;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={PLACEHOLDER}
              className="min-h-[180px] font-mono text-sm"
            />

            <Button
              onClick={handleCalculate}
              disabled={validIngredients.length === 0 || batchSearchQuery.isFetching}
              className="w-full"
            >
              {batchSearchQuery.isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate ({validIngredients.length} ingredient
                  {validIngredients.length !== 1 ? "s" : ""})
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Edit button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {matchedCount} of {resolvedIngredients.length} matched
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>

            {/* Ingredient rows */}
            <div className="space-y-2">
              {resolvedIngredients.map((ing, index) => (
                <MealIngredientRow
                  key={ing.id}
                  ingredient={ing}
                  index={index}
                  onSwap={setSwapIngredient}
                />
              ))}
            </div>

            {/* Total nutrition card */}
            {matchedCount > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                    Estimated Total
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {totalNutrition.calories}
                      </p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{totalNutrition.protein}g</p>
                      <p className="text-xs text-muted-foreground">protein</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{totalNutrition.carbs}g</p>
                      <p className="text-xs text-muted-foreground">carbs</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{totalNutrition.fat}g</p>
                      <p className="text-xs text-muted-foreground">fat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap sheet */}
      <MealSwapSheet
        ingredient={swapIngredient}
        open={!!swapIngredient}
        onOpenChange={(open) => !open && setSwapIngredient(null)}
        onSelect={handleSwapSelect}
      />
    </div>
  );
}
