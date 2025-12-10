"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { IngredientSearch, type IngredientProduct } from "./ingredient-search";
import { Search, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface IngredientData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isPercentage: boolean;
  baseIngredientId: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  isManualEntry: boolean;
  openFoodFactsId: string | null;
}

interface IngredientRowProps {
  ingredient: IngredientData;
  index: number;
  baseIngredients: { id: string; name: string }[];
  onChange: (updated: IngredientData) => void;
  onDelete: () => void;
}

export function IngredientRow({
  ingredient,
  index,
  baseIngredients,
  onChange,
  onDelete,
}: IngredientRowProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleProductSelect = (product: IngredientProduct) => {
    onChange({
      ...ingredient,
      name: product.name,
      caloriesPer100g: product.caloriesPer100g,
      proteinPer100g: product.proteinPer100g,
      carbsPer100g: product.carbsPer100g,
      fatPer100g: product.fatPer100g,
      fiberPer100g: product.fiberPer100g ?? 0,
      isManualEntry: false,
      openFoodFactsId: product.barcode ?? null,
    });
    setIsSearching(false);
  };

  const updateField = <K extends keyof IngredientData>(
    field: K,
    value: IngredientData[K]
  ) => {
    onChange({ ...ingredient, [field]: value });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card rounded-xl border border-border/50 overflow-hidden"
    >
      {/* Main row */}
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
          <span className="text-xs text-muted-foreground font-medium w-5">
            {index + 1}
          </span>

          {isSearching ? (
            <div className="flex-1">
              <IngredientSearch
                onSelect={handleProductSelect}
                onClose={() => setIsSearching(false)}
              />
            </div>
          ) : (
            <>
              <Input
                value={ingredient.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ingredient name"
                className="flex-1 h-9 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={() => setIsSearching(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {!isSearching && (
          <>
            {/* Quantity and unit */}
            <div className="flex items-center gap-2 pl-9">
              <Input
                type="number"
                value={ingredient.quantity}
                onChange={(e) => updateField("quantity", Number(e.target.value))}
                placeholder="Amount"
                className="w-24 h-9 text-sm"
                min={0}
                step={ingredient.isPercentage ? 0.1 : 1}
              />
              <Select
                value={ingredient.unit}
                onValueChange={(value) => updateField("unit", value)}
              >
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                </SelectContent>
              </Select>

              {/* Percentage toggle */}
              <div className="flex items-center gap-2 ml-auto">
                <Label htmlFor={`pct-${ingredient.id}`} className="text-xs text-muted-foreground">
                  Baker's %
                </Label>
                <Switch
                  id={`pct-${ingredient.id}`}
                  checked={ingredient.isPercentage}
                  onCheckedChange={(checked) => {
                    updateField("isPercentage", checked);
                    updateField("unit", checked ? "%" : "g");
                  }}
                />
              </div>
            </div>

            {/* Base ingredient selector for percentages */}
            <AnimatePresence>
              {ingredient.isPercentage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-9"
                >
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                      % of:
                    </Label>
                    <Select
                      value={ingredient.baseIngredientId ?? ""}
                      onValueChange={(value) => updateField("baseIngredientId", value)}
                    >
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="Select base ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {baseIngredients.map((base) => (
                          <SelectItem key={base.id} value={base.id}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expand/collapse nutrition */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pl-9"
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {isExpanded ? "Hide" : "Show"} nutrition ({Math.round(ingredient.caloriesPer100g)} kcal/100g)
            </button>
          </>
        )}
      </div>

      {/* Expanded nutrition section */}
      <AnimatePresence>
        {isExpanded && !isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/50 bg-muted/30 p-3"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2 pl-9">
              Nutrition per 100g/ml
            </p>
            <div className="grid grid-cols-5 gap-2 pl-9">
              <div>
                <Label className="text-[10px]">Calories</Label>
                <Input
                  type="number"
                  value={ingredient.caloriesPer100g}
                  onChange={(e) => updateField("caloriesPer100g", Number(e.target.value))}
                  className="h-8 text-xs"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-[10px]">Protein</Label>
                <Input
                  type="number"
                  value={ingredient.proteinPer100g}
                  onChange={(e) => updateField("proteinPer100g", Number(e.target.value))}
                  className="h-8 text-xs"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-[10px]">Carbs</Label>
                <Input
                  type="number"
                  value={ingredient.carbsPer100g}
                  onChange={(e) => updateField("carbsPer100g", Number(e.target.value))}
                  className="h-8 text-xs"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-[10px]">Fat</Label>
                <Input
                  type="number"
                  value={ingredient.fatPer100g}
                  onChange={(e) => updateField("fatPer100g", Number(e.target.value))}
                  className="h-8 text-xs"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-[10px]">Fiber</Label>
                <Input
                  type="number"
                  value={ingredient.fiberPer100g}
                  onChange={(e) => updateField("fiberPer100g", Number(e.target.value))}
                  className="h-8 text-xs"
                  min={0}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
