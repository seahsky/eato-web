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
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface FoodProduct {
  barcode?: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  servingSize: number;
  servingUnit: string;
}

interface FoodEntryFormProps {
  product?: FoodProduct | null;
  defaultMealType?: string;
  onSuccess?: () => void;
}

export function FoodEntryForm({
  product,
  defaultMealType = "LUNCH",
  onSuccess,
}: FoodEntryFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState(product?.name ?? "");
  const [servingSize, setServingSize] = useState(product?.servingSize ?? 100);
  const [mealType, setMealType] = useState(defaultMealType);

  // Calculate nutrients based on serving size
  const ratio = product ? servingSize / 100 : 1;
  const [manualCalories, setManualCalories] = useState(100);

  const calories = product
    ? Math.round(product.caloriesPer100g * ratio)
    : manualCalories;
  const protein = product ? Math.round(product.proteinPer100g * ratio) : 0;
  const carbs = product ? Math.round(product.carbsPer100g * ratio) : 0;
  const fat = product ? Math.round(product.fatPer100g * ratio) : 0;

  const logMutation = trpc.food.log.useMutation({
    onSuccess: () => {
      toast.success("Food logged successfully!");
      utils.stats.getDailySummary.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log food");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    logMutation.mutate({
      name,
      barcode: product?.barcode,
      brand: product?.brand ?? undefined,
      imageUrl: product?.imageUrl ?? undefined,
      calories,
      protein: product ? protein : undefined,
      carbs: product ? carbs : undefined,
      fat: product ? fat : undefined,
      fiber: product?.fiberPer100g ? Math.round(product.fiberPer100g * ratio) : undefined,
      sugar: product?.sugarPer100g ? Math.round(product.sugarPer100g * ratio) : undefined,
      sodium: product?.sodiumPer100g ? Math.round(product.sodiumPer100g * ratio) : undefined,
      servingSize,
      servingUnit: product?.servingUnit ?? "g",
      mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
      consumedAt: new Date().toISOString(),
      isManualEntry: !product,
      openFoodFactsId: product?.barcode,
    });
  };

  const adjustServing = (delta: number) => {
    setServingSize((prev) => Math.max(1, prev + delta));
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-serif">
          {product ? "Add Food" : "Quick Add"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Food Info */}
          {product && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{product.name}</p>
                {product.brand && (
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                )}
              </div>
            </div>
          )}

          {/* Name (for manual entry) */}
          {!product && (
            <div className="space-y-2">
              <Label>Food Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Apple, Coffee"
                required
              />
            </div>
          )}

          {/* Serving Size */}
          <div className="space-y-2">
            <Label>Serving Size ({product?.servingUnit ?? "g"})</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => adjustServing(-10)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(Number(e.target.value))}
                className="text-center text-lg font-semibold"
                min={1}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => adjustServing(10)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calories (for manual entry) */}
          {!product && (
            <div className="space-y-2">
              <Label>Calories</Label>
              <Input
                type="number"
                value={manualCalories}
                onChange={(e) => setManualCalories(Number(e.target.value))}
                min={0}
                required
              />
            </div>
          )}

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
              <p className="text-lg font-bold text-primary">{calories}</p>
              <p className="text-[10px] text-muted-foreground uppercase">kcal</p>
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
              `Add ${calories} kcal`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
