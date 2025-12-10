"use client";

import { motion } from "framer-motion";
import { EnergyValue } from "@/components/ui/energy-value";
import { useEnergyUnit } from "@/contexts/energy-context";

interface NutritionPreviewProps {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  label?: string;
}

export function NutritionPreview({
  caloriesPer100g,
  proteinPer100g,
  carbsPer100g,
  fatPer100g,
  label = "per 100g",
}: NutritionPreviewProps) {
  const { energyUnit } = useEnergyUnit();

  return (
    <motion.div
      className="p-4 bg-muted/30 rounded-xl space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Nutrition {label}
      </p>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <EnergyValue
            kcal={caloriesPer100g}
            showUnit={false}
            className="text-xl font-bold text-primary"
          />
          <p className="text-[10px] text-muted-foreground uppercase">
            {energyUnit === "KJ" ? "kJ" : "kcal"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{Math.round(proteinPer100g)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">protein</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{Math.round(carbsPer100g)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">carbs</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{Math.round(fatPer100g)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">fat</p>
        </div>
      </div>
    </motion.div>
  );
}
