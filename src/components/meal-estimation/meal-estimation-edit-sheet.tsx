"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyValue } from "@/components/ui/energy-value";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, Calculator, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { MealEstimationIngredientRow } from "./meal-estimation-ingredient-row";
import { MealSwapSheet } from "@/components/food/meal-swap-sheet";
import { Switch } from "@/components/ui/switch";
import type { MealEstimationIngredient } from "@/types/meal-estimation";
import type { FoodProduct } from "@/types/food";

interface MealEstimationEditSheetProps {
  estimationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadToCalculator?: (estimation: {
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

export function MealEstimationEditSheet({
  estimationId,
  open,
  onOpenChange,
  onLoadToCalculator,
}: MealEstimationEditSheetProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Local state for editing
  const [ingredients, setIngredients] = useState<MealEstimationIngredient[]>([]);
  const [swapIngredient, setSwapIngredient] = useState<MealEstimationIngredient | null>(null);
  const [mealType, setMealType] = useState("LUNCH");
  const [logForPartner, setLogForPartner] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get user info for partner feature
  const { data: user } = trpc.auth.getMe.useQuery();
  const hasPartner = !!user?.partner;

  // Fetch estimation data
  const { data: estimation, isLoading } = trpc.mealEstimation.getById.useQuery(
    { id: estimationId! },
    { enabled: !!estimationId && open }
  );

  // Reset state when estimation changes
  useEffect(() => {
    if (estimation) {
      setIngredients(estimation.ingredients);
      setHasChanges(false);
    }
  }, [estimation]);

  // Calculate totals from ingredients
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let grams = 0;

    for (const ing of ingredients) {
      if (ing.hasMatch && ing.caloriesPer100g != null) {
        const ratio = ing.normalizedGrams / 100;
        calories += ing.caloriesPer100g * ratio;
        protein += (ing.proteinPer100g ?? 0) * ratio;
        carbs += (ing.carbsPer100g ?? 0) * ratio;
        fat += (ing.fatPer100g ?? 0) * ratio;
      }
      grams += ing.normalizedGrams;
    }

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      grams: Math.round(grams),
    };
  }, [ingredients]);

  // Handle quantity change
  const handleQuantityChange = useCallback((id: string, newQuantity: number) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;

        // Calculate new normalized grams based on unit
        let newGrams = newQuantity;
        if (ing.unit === "kg") newGrams = newQuantity * 1000;
        if (ing.unit === "ml" || ing.unit === "l") {
          newGrams = ing.unit === "l" ? newQuantity * 1000 : newQuantity;
        }

        // Recalculate nutrition for this ingredient
        const ratio = newGrams / 100;
        return {
          ...ing,
          quantity: newQuantity,
          normalizedGrams: newGrams,
          calories: ing.caloriesPer100g != null ? ing.caloriesPer100g * ratio : 0,
          protein: ing.proteinPer100g != null ? ing.proteinPer100g * ratio : 0,
          carbs: ing.carbsPer100g != null ? ing.carbsPer100g * ratio : 0,
          fat: ing.fatPer100g != null ? ing.fatPer100g * ratio : 0,
        };
      })
    );
    setHasChanges(true);
  }, []);

  // Handle product swap
  const handleSwapSelect = useCallback((swappedIngredient: MealEstimationIngredient, newProduct: FoodProduct) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== swappedIngredient.id) return ing;

        const ratio = ing.normalizedGrams / 100;
        return {
          ...ing,
          matchedProductId: newProduct.id,
          matchedProductName: newProduct.name,
          matchedProductBrand: newProduct.brand ?? null,
          dataSource: newProduct.dataSource,
          caloriesPer100g: newProduct.caloriesPer100g,
          proteinPer100g: newProduct.proteinPer100g,
          carbsPer100g: newProduct.carbsPer100g,
          fatPer100g: newProduct.fatPer100g,
          hasMatch: true,
          calories: newProduct.caloriesPer100g * ratio,
          protein: newProduct.proteinPer100g * ratio,
          carbs: newProduct.carbsPer100g * ratio,
          fat: newProduct.fatPer100g * ratio,
        };
      })
    );
    setSwapIngredient(null);
    setHasChanges(true);
  }, []);

  // Handle remove ingredient
  const handleRemove = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    setHasChanges(true);
  }, []);

  // Generate name from ingredients
  const generateName = useCallback(() => {
    const ingredientNames = ingredients
      .filter((ing) => ing.hasMatch)
      .map((ing) => ing.ingredientName)
      .slice(0, 3);
    return ingredientNames.length > 0
      ? ingredientNames.join(", ") + (ingredients.filter((ing) => ing.hasMatch).length > 3 ? "..." : "")
      : "Meal Estimate";
  }, [ingredients]);

  // Update mutation
  const updateMutation = trpc.mealEstimation.update.useMutation({
    onSuccess: () => {
      toast.success("Estimation saved!");
      utils.mealEstimation.list.invalidate();
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save estimation");
    },
  });

  // Delete mutation
  const deleteMutation = trpc.mealEstimation.delete.useMutation({
    onSuccess: () => {
      toast.success("Estimation deleted!");
      utils.mealEstimation.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete estimation");
    },
  });

  // Log meal mutation
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
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log meal");
    },
  });

  // Link food entry mutation
  const linkMutation = trpc.mealEstimation.linkFoodEntry.useMutation();

  // Handle save
  const handleSave = () => {
    if (!estimationId || !estimation) return;

    // Generate raw input text from ingredients
    const rawInputText = ingredients
      .map((ing) => ing.rawLine)
      .join("\n");

    updateMutation.mutate({
      id: estimationId,
      data: {
        rawInputText,
        name: generateName(),
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        totalGrams: totals.grams,
        ingredients: ingredients.map((ing, index) => ({
          rawLine: ing.rawLine,
          ingredientName: ing.ingredientName,
          quantity: ing.quantity,
          unit: ing.unit,
          normalizedGrams: ing.normalizedGrams,
          matchedProductId: ing.matchedProductId,
          matchedProductName: ing.matchedProductName,
          matchedProductBrand: ing.matchedProductBrand,
          dataSource: ing.dataSource,
          caloriesPer100g: ing.caloriesPer100g,
          proteinPer100g: ing.proteinPer100g,
          carbsPer100g: ing.carbsPer100g,
          fatPer100g: ing.fatPer100g,
          calories: ing.calories,
          protein: ing.protein,
          carbs: ing.carbs,
          fat: ing.fat,
          hasMatch: ing.hasMatch,
          parseError: ing.parseError,
          sortOrder: index,
        })),
      },
    });
  };

  // Handle log meal
  const handleLogMeal = async () => {
    const name = generateName();

    const entry = await logMutation.mutateAsync({
      name,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      servingSize: totals.grams,
      servingUnit: "g",
      mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
      consumedAt: format(new Date(), "yyyy-MM-dd"),
      isManualEntry: true,
      dataSource: "MANUAL",
      forPartnerId: logForPartner ? user?.partner?.id : undefined,
    });

    // Link the food entry to this estimation
    if (estimationId && entry) {
      linkMutation.mutate({
        estimationId,
        foodEntryId: entry.id,
      });
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!estimationId) return;
    deleteMutation.mutate({ id: estimationId });
  };

  const isPending = updateMutation.isPending || deleteMutation.isPending || logMutation.isPending;

  // Convert for swap sheet
  const swapIngredientForSheet = swapIngredient
    ? {
        id: swapIngredient.id,
        rawLine: swapIngredient.rawLine,
        ingredientName: swapIngredient.ingredientName,
        quantity: swapIngredient.quantity,
        unit: swapIngredient.unit,
        normalizedGrams: swapIngredient.normalizedGrams,
        matchedProduct: swapIngredient.hasMatch
          ? {
              id: swapIngredient.matchedProductId!,
              name: swapIngredient.matchedProductName!,
              brand: swapIngredient.matchedProductBrand,
              caloriesPer100g: swapIngredient.caloriesPer100g!,
              proteinPer100g: swapIngredient.proteinPer100g!,
              carbsPer100g: swapIngredient.carbsPer100g!,
              fatPer100g: swapIngredient.fatPer100g!,
              fiberPer100g: 0,
              dataSource: swapIngredient.dataSource!,
            }
          : undefined,
        parseError: swapIngredient.parseError,
      }
    : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-serif">
              {estimation?.name ?? "Meal Estimation"}
            </SheetTitle>
            {estimation && (
              <SheetDescription>
                {format(new Date(estimation.createdAt), "PPp")} · {ingredients.length} ingredients
              </SheetDescription>
            )}
          </SheetHeader>

          {isLoading ? (
            <div className="flex-1 space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Ingredients list */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                <AnimatePresence mode="popLayout">
                  {ingredients.map((ing, index) => (
                    <MealEstimationIngredientRow
                      key={ing.id}
                      ingredient={ing}
                      index={index}
                      onQuantityChange={handleQuantityChange}
                      onSwap={setSwapIngredient}
                      onRemove={handleRemove}
                      disabled={isPending}
                    />
                  ))}
                </AnimatePresence>

                {ingredients.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No ingredients
                  </p>
                )}

                {/* Totals card */}
                {ingredients.length > 0 && (
                  <motion.div
                    className="p-3 bg-primary/5 border border-primary/20 rounded-xl mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Estimated Total
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <EnergyValue
                          kcal={totals.calories}
                          toggleable
                          className="text-xl font-bold text-primary"
                        />
                        <p className="text-[10px] text-muted-foreground">kcal</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{totals.protein}g</p>
                        <p className="text-[10px] text-muted-foreground">protein</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{totals.carbs}g</p>
                        <p className="text-[10px] text-muted-foreground">carbs</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{totals.fat}g</p>
                        <p className="text-[10px] text-muted-foreground">fat</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Log controls */}
                {ingredients.length > 0 && (
                  <div className="space-y-3 pt-3">
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
                            <Label htmlFor="log-for-partner-edit" className="text-sm font-normal cursor-pointer">
                              Log for {user?.partner?.name}
                            </Label>
                          </div>
                          <Switch
                            id="log-for-partner-edit"
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
                  </div>
                )}
              </div>

              <SheetFooter className="gap-2 px-4 pb-4">
                {hasChanges && (
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleLogMeal}
                  disabled={isPending || ingredients.length === 0}
                  className="flex-1 h-12 text-base font-semibold"
                >
                  {logMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Log {totals.calories} kcal
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 text-destructive hover:text-destructive shrink-0"
                      disabled={isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Estimation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this meal estimation? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Swap sheet */}
      <MealSwapSheet
        ingredient={swapIngredientForSheet as any}
        open={!!swapIngredient}
        onOpenChange={(isOpen) => !isOpen && setSwapIngredient(null)}
        onSelect={(ing, product) => {
          if (swapIngredient) {
            handleSwapSelect(swapIngredient, product);
          }
        }}
      />
    </>
  );
}
