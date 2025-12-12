"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";
import { formatEnergy } from "@/lib/energy";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { FoodEntry } from "@/types/food";

interface FoodEntryEditSheetProps {
  entry: FoodEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export function FoodEntryEditSheet({
  entry,
  open,
  onOpenChange,
  currentUserId,
}: FoodEntryEditSheetProps) {
  const utils = trpc.useUtils();
  const { energyUnit } = useEnergyUnit();

  // Form state
  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState(100);
  const [mealType, setMealType] = useState("LUNCH");
  const [manualCalories, setManualCalories] = useState(0);

  // Reset form when entry changes
  useEffect(() => {
    if (entry) {
      setName(entry.name);
      setServingSize(entry.servingSize);
      setMealType(entry.mealType);
      setManualCalories(entry.calories);
    }
  }, [entry]);

  // Calculate if user can edit
  const canEdit = useMemo(() => {
    if (!entry || !currentUserId) return false;
    const isOwner = entry.userId === currentUserId;
    const isLogger = entry.loggedByUserId === currentUserId;

    if (entry.approvalStatus === "APPROVED") {
      return isOwner;
    }
    // PENDING or REJECTED - only logger can edit
    return isLogger;
  }, [entry, currentUserId]);

  // Calculate nutrients based on serving size change
  const nutritionData = useMemo(() => {
    if (!entry) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    if (entry.isManualEntry) {
      return {
        calories: manualCalories,
        protein: entry.protein ?? 0,
        carbs: entry.carbs ?? 0,
        fat: entry.fat ?? 0,
      };
    }

    // For non-manual entries, calculate based on serving size ratio
    const originalServingSize = entry.servingSize;
    if (originalServingSize === 0) {
      return {
        calories: entry.calories,
        protein: entry.protein ?? 0,
        carbs: entry.carbs ?? 0,
        fat: entry.fat ?? 0,
      };
    }

    const ratio = servingSize / originalServingSize;
    return {
      calories: Math.round(entry.calories * ratio),
      protein: Math.round((entry.protein ?? 0) * ratio),
      carbs: Math.round((entry.carbs ?? 0) * ratio),
      fat: Math.round((entry.fat ?? 0) * ratio),
    };
  }, [entry, servingSize, manualCalories]);

  const updateMutation = trpc.food.update.useMutation({
    onSuccess: () => {
      toast.success("Entry updated successfully!");
      utils.stats.getDailySummary.invalidate();
      utils.food.getPendingApprovalCount.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update entry");
    },
  });

  const deleteMutation = trpc.food.delete.useMutation({
    onMutate: async ({ id }) => {
      // Close the sheet immediately for better UX
      onOpenChange(false);

      // Cancel any outgoing refetches
      await utils.stats.getDailySummary.cancel();

      // We can't easily optimistically update getDailySummary due to its complex structure
      // but closing the sheet immediately gives instant feedback

      return { deletedId: id };
    },
    onSuccess: () => {
      toast.success("Entry deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete entry");
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      utils.stats.getDailySummary.invalidate();
      utils.food.getPendingApprovalCount.invalidate();
    },
  });

  const handleSave = () => {
    if (!entry) return;

    const updateData: Record<string, unknown> = {
      mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
    };

    if (entry.isManualEntry) {
      updateData.name = name;
      updateData.calories = manualCalories;
    } else {
      updateData.servingSize = servingSize;
      updateData.calories = nutritionData.calories;
      updateData.protein = nutritionData.protein;
      updateData.carbs = nutritionData.carbs;
      updateData.fat = nutritionData.fat;
    }

    updateMutation.mutate({
      id: entry.id,
      data: updateData,
    });
  };

  const handleDelete = () => {
    if (!entry) return;
    deleteMutation.mutate({ id: entry.id });
  };

  const adjustServing = (delta: number) => {
    setServingSize((prev) => Math.max(1, prev + delta));
  };

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif">Edit Entry</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-4 py-2">
          {/* Food Info Display */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            {entry.imageUrl ? (
              <img
                src={entry.imageUrl}
                alt={entry.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl">
                🍽️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{entry.name}</p>
              {entry.brand && (
                <p className="text-sm text-muted-foreground">{entry.brand}</p>
              )}
              {!canEdit && (
                <p className="text-xs text-amber-600 mt-1">
                  You cannot edit this entry
                </p>
              )}
            </div>
          </div>

          {/* Name (for manual entry only) */}
          {entry.isManualEntry && canEdit && (
            <div className="space-y-2">
              <Label>Food Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Apple, Coffee"
                disabled={!canEdit}
              />
            </div>
          )}

          {/* Serving Size (for non-manual entries) */}
          {!entry.isManualEntry && (
            <div className="space-y-2">
              <Label>Serving Size ({entry.servingUnit ?? "g"})</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => adjustServing(-10)}
                  disabled={!canEdit || isPending}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={servingSize}
                  onChange={(e) => setServingSize(Number(e.target.value))}
                  className="text-center text-lg font-semibold"
                  min={1}
                  disabled={!canEdit || isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => adjustServing(10)}
                  disabled={!canEdit || isPending}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Calories (for manual entry only) */}
          {entry.isManualEntry && canEdit && (
            <div className="space-y-2">
              <Label>Calories</Label>
              <Input
                type="number"
                value={manualCalories}
                onChange={(e) => setManualCalories(Number(e.target.value))}
                min={0}
                disabled={!canEdit || isPending}
              />
            </div>
          )}

          {/* Meal Type */}
          <div className="space-y-2">
            <Label>Meal</Label>
            <Select
              value={mealType}
              onValueChange={setMealType}
              disabled={!canEdit || isPending}
            >
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

          {/* Nutrition Summary */}
          <NutritionSummary
            calories={nutritionData.calories}
            protein={nutritionData.protein}
            carbs={nutritionData.carbs}
            fat={nutritionData.fat}
          />
        </div>

        <SheetFooter className="gap-2">
          {canEdit && (
            <>
              <Button
                onClick={handleSave}
                className="flex-1 h-12 text-base font-semibold"
                disabled={isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save ${formatEnergy(nutritionData.calories, energyUnit)}`
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 text-destructive hover:text-destructive"
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
                    <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{entry.name}&quot;? This
                      action cannot be undone.
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
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function NutritionSummary({
  calories,
  protein,
  carbs,
  fat,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const { energyUnit } = useEnergyUnit();

  return (
    <motion.div
      className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center">
        <EnergyValue
          kcal={calories}
          showUnit={false}
          toggleable
          className="text-lg font-bold text-primary"
        />
        <p className="text-[10px] text-muted-foreground uppercase">
          {energyUnit === "KJ" ? "kJ" : "kcal"}
        </p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">{protein}</p>
        <p className="text-[10px] text-muted-foreground uppercase">protein</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">{carbs}</p>
        <p className="text-[10px] text-muted-foreground uppercase">carbs</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">{fat}</p>
        <p className="text-[10px] text-muted-foreground uppercase">fat</p>
      </div>
    </motion.div>
  );
}
