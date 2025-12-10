"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";
import { formatEnergy } from "@/lib/energy";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import { calculatePortionNutrition } from "@/lib/recipe-calculator";

interface Recipe {
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
}

interface RecipeLogFormProps {
  recipe: Recipe;
  defaultMealType?: string;
  onSuccess?: () => void;
}

export function RecipeLogForm({
  recipe,
  defaultMealType = "LUNCH",
  onSuccess,
}: RecipeLogFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { energyUnit } = useEnergyUnit();

  const [consumedWeight, setConsumedWeight] = useState(100);
  const [mealType, setMealType] = useState(defaultMealType);

  // Calculate nutrition for the consumed portion
  const portionNutrition = calculatePortionNutrition(
    {
      caloriesPer100g: recipe.caloriesPer100g,
      proteinPer100g: recipe.proteinPer100g,
      carbsPer100g: recipe.carbsPer100g,
      fatPer100g: recipe.fatPer100g,
      fiberPer100g: recipe.fiberPer100g,
    },
    consumedWeight
  );

  const logMutation = trpc.recipe.log.useMutation({
    onSuccess: () => {
      toast.success("Recipe logged successfully!");
      utils.stats.getDailySummary.invalidate();
      utils.recipe.list.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log recipe");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    logMutation.mutate({
      recipeId: recipe.id,
      consumedWeight,
      mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
      consumedAt: new Date().toISOString(),
    });
  };

  const adjustWeight = (delta: number) => {
    setConsumedWeight((prev) => Math.max(1, prev + delta));
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-serif">Log Recipe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Recipe Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{recipe.name}</p>
              <p className="text-sm text-muted-foreground">
                <EnergyValue kcal={recipe.caloriesPer100g} /> / 100g
              </p>
              <p className="text-xs text-muted-foreground">
                Yield: {recipe.yieldWeight}{recipe.yieldUnit}
              </p>
            </div>
          </div>

          {/* Consumed Weight */}
          <div className="space-y-2">
            <Label>Portion Size (g)</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => adjustWeight(-10)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={consumedWeight}
                onChange={(e) => setConsumedWeight(Number(e.target.value))}
                className="text-center text-lg font-semibold"
                min={1}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => adjustWeight(10)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {Math.round((consumedWeight / recipe.yieldWeight) * 100)}% of total recipe
            </p>
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label>Meal</Label>
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

          {/* Nutrition Summary */}
          <motion.div
            className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <EnergyValue
                kcal={portionNutrition.calories}
                showUnit={false}
                className="text-lg font-bold text-primary"
              />
              <p className="text-[10px] text-muted-foreground uppercase">
                {energyUnit === "KJ" ? "kJ" : "kcal"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{portionNutrition.protein}</p>
              <p className="text-[10px] text-muted-foreground uppercase">protein</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{portionNutrition.carbs}</p>
              <p className="text-[10px] text-muted-foreground uppercase">carbs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{portionNutrition.fat}</p>
              <p className="text-[10px] text-muted-foreground uppercase">fat</p>
            </div>
          </motion.div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={logMutation.isPending}
          >
            {logMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${formatEnergy(portionNutrition.calories, energyUnit)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
