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
import { formatEnergy, convertToKcal, getEnergyLabel, convertEnergy, getOppositeUnit, type EnergyUnit } from "@/lib/energy";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, Users } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import type { FoodProduct } from "@/types/food";

interface FoodEntryFormProps {
  product?: FoodProduct | null;
  defaultMealType?: string;
  date?: string;
  onSuccess?: () => void;
}

export function FoodEntryForm({
  product,
  defaultMealType = "LUNCH",
  date,
  onSuccess,
}: FoodEntryFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { energyUnit: userPreferredUnit } = useEnergyUnit();

  const [name, setName] = useState(product?.name ?? "");
  const [servingSize, setServingSize] = useState(product?.servingSize ?? 100);
  const [mealType, setMealType] = useState(defaultMealType);
  const [logForPartner, setLogForPartner] = useState(false);

  // Get user info to check for partner
  const { data: user } = trpc.auth.getMe.useQuery();
  const hasPartner = !!user?.partner;

  // Calculate nutrients based on serving size
  const ratio = product ? servingSize / 100 : 1;
  const [manualEnergyValue, setManualEnergyValue] = useState(100);
  const [inputUnit, setInputUnit] = useState<EnergyUnit>(userPreferredUnit);

  // Convert manual energy input to kcal for storage
  const manualCaloriesKcal = convertToKcal(manualEnergyValue, inputUnit);

  const calories = product
    ? Math.round(product.caloriesPer100g * ratio)
    : manualCaloriesKcal;
  const protein = product ? Math.round(product.proteinPer100g * ratio) : 0;
  const carbs = product ? Math.round(product.carbsPer100g * ratio) : 0;
  const fat = product ? Math.round(product.fatPer100g * ratio) : 0;

  const logMutation = trpc.food.log.useMutation({
    onSuccess: () => {
      if (logForPartner) {
        toast.success(`Food logged for ${user?.partner?.name}! They will need to approve it.`);
        utils.food.getMyPendingSubmissions.invalidate();
      } else {
        toast.success("Food logged successfully!");
      }
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
      barcode: product?.barcode ?? undefined,
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
      consumedAt: date || format(new Date(), "yyyy-MM-dd"),
      isManualEntry: !product,
      dataSource: product?.dataSource ?? "MANUAL",
      openFoodFactsId: product?.dataSource === "OPEN_FOOD_FACTS" ? product.barcode ?? undefined : undefined,
      usdaFdcId: product?.dataSource === "USDA" ? product.fdcId ?? undefined : undefined,
      forPartnerId: logForPartner ? user?.partner?.id : undefined,
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

          {/* Energy (for manual entry) */}
          {!product && (
            <div className="space-y-2">
              <Label>Energy</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={manualEnergyValue}
                  onChange={(e) => setManualEnergyValue(Number(e.target.value))}
                  className="flex-1 text-lg font-semibold"
                  min={0}
                  required
                />
                <Select
                  value={inputUnit}
                  onValueChange={(value) => setInputUnit(value as EnergyUnit)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KCAL">kcal</SelectItem>
                    <SelectItem value="KJ">kJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                = {convertEnergy(manualCaloriesKcal, getOppositeUnit(inputUnit))} {getEnergyLabel(getOppositeUnit(inputUnit))}
              </p>
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

          {/* Log for Partner Toggle */}
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

          {/* Nutrition Summary */}
          <NutritionSummary calories={calories} protein={protein} carbs={carbs} fat={fat} />

          {/* Submit */}
          <SubmitButton isPending={logMutation.isPending} calories={calories} />
        </form>
      </CardContent>
    </Card>
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

function SubmitButton({
  isPending,
  calories,
}: {
  isPending: boolean;
  calories: number;
}) {
  const { energyUnit } = useEnergyUnit();

  return (
    <Button
      type="submit"
      className="w-full h-12 text-base font-semibold"
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        `Add ${formatEnergy(calories, energyUnit)}`
      )}
    </Button>
  );
}
