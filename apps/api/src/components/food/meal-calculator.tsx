"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Pencil, Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";
import { formatEnergy } from "@/lib/energy";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { parseIngredientLines } from "@/lib/meal-parser";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MealIngredientRow, type ResolvedMealIngredient } from "./meal-ingredient-row";
import { MealSwapSheet } from "./meal-swap-sheet";
import { MealEstimationHistory } from "@/components/meal-estimation/meal-estimation-history";
import type { FoodProduct } from "@/types/food";

const PLACEHOLDER = `Enter ingredients, one per line:

200g flour
130g egg
100g olive oil
30g honey`;

export function MealCalculator() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { energyUnit } = useEnergyUnit();

  const [inputText, setInputText] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [resolvedIngredients, setResolvedIngredients] = useState<ResolvedMealIngredient[]>([]);
  const [swapIngredient, setSwapIngredient] = useState<ResolvedMealIngredient | null>(null);
  const [mealType, setMealType] = useState("LUNCH");
  const [logForPartner, setLogForPartner] = useState(false);
  const [currentEstimationId, setCurrentEstimationId] = useState<string | null>(null);

  // Get user info for partner feature
  const { data: user } = trpc.auth.getMe.useQuery();
  const hasPartner = !!user?.partner;

  // Parse input into structured ingredients
  const parsedIngredients = useMemo(() => {
    if (!inputText.trim()) return [];
    return parseIngredientLines(inputText);
  }, [inputText]);

  // Count valid ingredients (no parse errors)
  const validIngredients = parsedIngredients.filter((ing) => !ing.parseError);

  // Searchable ingredients (exclude direct energy entries)
  const searchableIngredients = validIngredients.filter((ing) => !ing.isDirectEnergy);

  // Batch search query
  const batchSearchQuery = trpc.food.batchSearch.useQuery(
    {
      queries: searchableIngredients.map((ing) => ({
        id: ing.id,
        query: ing.ingredientName,
      })),
    },
    {
      enabled: false, // Manual trigger
    }
  );

  // Create estimation mutation (must be defined before handleCalculate)
  const createEstimationMutation = trpc.mealEstimation.create.useMutation({
    onSuccess: (data) => {
      setCurrentEstimationId(data.id);
      utils.mealEstimation.list.invalidate();
    },
  });

  // Link food entry to estimation mutation
  const linkEstimationMutation = trpc.mealEstimation.linkFoodEntry.useMutation();

  // Calculate button handler
  const handleCalculate = useCallback(async () => {
    if (validIngredients.length === 0) return;

    setIsEditing(false);
    setCurrentEstimationId(null);

    // Trigger the batch search
    const result = await batchSearchQuery.refetch();

    if (result.data || searchableIngredients.length === 0) {
      // Merge search results with parsed ingredients
      const resolved: ResolvedMealIngredient[] = parsedIngredients.map((ing) => {
        if (ing.parseError) {
          return ing;
        }

        // Direct energy entries - no product search needed
        if (ing.isDirectEnergy) {
          return {
            ...ing,
            matchedProduct: undefined,
            alternatives: undefined,
            calculatedCalories: ing.directCalories,
          };
        }

        const searchResult = result.data?.find((r: { id: string; query: string; products: FoodProduct[] }) => r.id === ing.id);
        const matchedProduct = searchResult?.products[0];
        const alternatives = searchResult?.products.slice(1);

        return {
          ...ing,
          matchedProduct,
          alternatives,
        };
      });

      setResolvedIngredients(resolved);

      // Save estimation to history
      const matchedIngredients = resolved.filter((ing) => ing.isDirectEnergy || ing.matchedProduct);
      const ingredientNames = matchedIngredients
        .map((ing) => ing.ingredientName)
        .slice(0, 3);
      const name =
        ingredientNames.length > 0
          ? ingredientNames.join(", ") + (matchedIngredients.length > 3 ? "..." : "")
          : "Meal Estimate";

      // Calculate totals
      const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, grams: 0 };
      for (const ing of resolved) {
        if (ing.isDirectEnergy && ing.directCalories) {
          // Direct energy - only add calories, macros unknown
          totals.calories += ing.directCalories;
        } else if (ing.matchedProduct) {
          const ratio = ing.normalizedGrams / 100;
          totals.calories += ing.matchedProduct.caloriesPer100g * ratio;
          totals.protein += ing.matchedProduct.proteinPer100g * ratio;
          totals.carbs += ing.matchedProduct.carbsPer100g * ratio;
          totals.fat += ing.matchedProduct.fatPer100g * ratio;
        }
        totals.grams += ing.normalizedGrams;
      }

      // Create estimation
      createEstimationMutation.mutate({
        rawInputText: inputText,
        name,
        totalCalories: Math.round(totals.calories),
        totalProtein: Math.round(totals.protein),
        totalCarbs: Math.round(totals.carbs),
        totalFat: Math.round(totals.fat),
        totalGrams: Math.round(totals.grams),
        ingredients: resolved.map((ing, index) => ({
          rawLine: ing.rawLine,
          ingredientName: ing.ingredientName,
          quantity: ing.quantity,
          unit: ing.unit,
          normalizedGrams: ing.normalizedGrams,
          matchedProductId: ing.matchedProduct?.id ?? null,
          matchedProductName: ing.matchedProduct?.name ?? null,
          matchedProductBrand: ing.matchedProduct?.brand ?? null,
          dataSource: ing.matchedProduct?.dataSource ?? null,
          caloriesPer100g: ing.matchedProduct?.caloriesPer100g ?? null,
          proteinPer100g: ing.matchedProduct?.proteinPer100g ?? null,
          carbsPer100g: ing.matchedProduct?.carbsPer100g ?? null,
          fatPer100g: ing.matchedProduct?.fatPer100g ?? null,
          calories: ing.isDirectEnergy
            ? Math.round(ing.directCalories || 0)
            : ing.matchedProduct
              ? Math.round((ing.matchedProduct.caloriesPer100g * ing.normalizedGrams) / 100)
              : 0,
          protein: ing.matchedProduct
            ? Math.round((ing.matchedProduct.proteinPer100g * ing.normalizedGrams) / 100)
            : 0,
          carbs: ing.matchedProduct
            ? Math.round((ing.matchedProduct.carbsPer100g * ing.normalizedGrams) / 100)
            : 0,
          fat: ing.matchedProduct
            ? Math.round((ing.matchedProduct.fatPer100g * ing.normalizedGrams) / 100)
            : 0,
          hasMatch: ing.isDirectEnergy || !!ing.matchedProduct,
          parseError: ing.parseError ?? null,
          sortOrder: index,
        })),
      });
    }
  }, [validIngredients, parsedIngredients, batchSearchQuery, inputText, createEstimationMutation]);

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
      if (ing.isDirectEnergy && ing.directCalories) {
        // Direct energy - only add calories
        totals.calories += ing.directCalories;
      } else if (ing.matchedProduct) {
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

  // Count matched ingredients (includes direct energy entries)
  const matchedCount = resolvedIngredients.filter((ing) => ing.isDirectEnergy || ing.matchedProduct).length;

  // Log mutation
  const logMutation = trpc.food.log.useMutation({
    onSuccess: () => {
      if (logForPartner) {
        toast.success(`Meal logged for ${user?.partner?.name}! They will need to approve it.`);
        utils.food.getMyPendingSubmissions.invalidate();
      } else {
        toast.success("Meal logged successfully!");
      }
      utils.stats.getDailySummary.invalidate();
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log meal");
    },
  });

  // Handle log meal
  const handleLogMeal = useCallback(async () => {
    // Generate name from matched ingredients (max 3, truncated)
    const matchedIngredients = resolvedIngredients.filter((ing) => ing.isDirectEnergy || ing.matchedProduct);
    const ingredientNames = matchedIngredients
      .map((ing) => ing.ingredientName)
      .slice(0, 3);
    const name =
      ingredientNames.length > 0
        ? ingredientNames.join(", ") + (matchedIngredients.length > 3 ? "..." : "")
        : "Meal Estimate";

    // Calculate total serving size from all ingredients
    const totalGrams = resolvedIngredients.reduce(
      (sum, ing) => sum + (ing.normalizedGrams || 0),
      0
    );

    const entry = await logMutation.mutateAsync({
      name,
      calories: totalNutrition.calories,
      protein: totalNutrition.protein,
      carbs: totalNutrition.carbs,
      fat: totalNutrition.fat,
      servingSize: Math.round(totalGrams),
      servingUnit: "g",
      mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
      consumedAt: format(new Date(), "yyyy-MM-dd"),
      isManualEntry: true,
      dataSource: "MANUAL",
      forPartnerId: logForPartner ? user?.partner?.id : undefined,
    });

    // Link food entry to estimation if we have one
    if (currentEstimationId && entry) {
      linkEstimationMutation.mutate({
        estimationId: currentEstimationId,
        foodEntryId: entry.id,
      });
    }
  }, [resolvedIngredients, totalNutrition, mealType, logForPartner, user?.partner?.id, logMutation, currentEstimationId, linkEstimationMutation]);

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
                      <EnergyValue
                        kcal={totalNutrition.calories}
                        toggleable
                        className="text-2xl font-bold text-primary"
                        unitClassName="text-xs font-normal"
                      />
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

            {/* Log controls */}
            {matchedCount > 0 && (
              <div className="space-y-3">
                {/* Meal Type Selector */}
                <div className="space-y-2">
                  <Label>Log as</Label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                      <SelectItem value="LUNCH">Lunch</SelectItem>
                      <SelectItem value="DINNER">Dinner</SelectItem>
                      <SelectItem value="SNACK">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Partner Toggle */}
                {hasPartner && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="log-for-partner" className="text-sm font-normal cursor-pointer">
                          Log for {user?.partner?.name}
                        </Label>
                      </div>
                      <Switch
                        id="log-for-partner"
                        checked={logForPartner}
                        onCheckedChange={setLogForPartner}
                      />
                    </div>
                    {logForPartner && (
                      <p className="text-xs text-muted-foreground text-center">
                        {user?.partner?.name} will need to approve this entry
                      </p>
                    )}
                  </div>
                )}

                {/* Log Button */}
                <Button
                  onClick={handleLogMeal}
                  disabled={logMutation.isPending}
                  className="w-full"
                >
                  {logMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Log {formatEnergy(totalNutrition.calories, energyUnit)}
                    </>
                  )}
                </Button>
              </div>
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

      {/* History section */}
      {isEditing && <MealEstimationHistory />}
    </div>
  );
}
