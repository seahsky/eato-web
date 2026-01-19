"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IngredientRow, type IngredientData } from "./ingredient-row";
import { NutritionPreview } from "./nutrition-preview";
import { trpc } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculateRecipeNutrition,
  calculateTotalIngredientWeight,
} from "@/lib/recipe-calculator";

// Generate unique IDs for ingredients
let ingredientIdCounter = 0;
function generateId() {
  return `ing-${Date.now()}-${++ingredientIdCounter}`;
}

function createEmptyIngredient(): IngredientData {
  return {
    id: generateId(),
    name: "",
    quantity: 100,
    unit: "g",
    isPercentage: false,
    baseIngredientId: null,
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    fiberPer100g: 0,
    isManualEntry: true,
    openFoodFactsId: null,
  };
}

interface RecipeFormProps {
  mode?: "create" | "edit";
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    yieldWeight: number;
    yieldUnit: string;
    ingredients: IngredientData[];
  };
  onSuccess?: () => void;
}

export function RecipeForm({
  mode = "create",
  initialData,
  onSuccess,
}: RecipeFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [yieldWeight, setYieldWeight] = useState(initialData?.yieldWeight ?? 0);
  const [yieldUnit, setYieldUnit] = useState(initialData?.yieldUnit ?? "g");
  const [ingredients, setIngredients] = useState<IngredientData[]>(
    initialData?.ingredients ?? [createEmptyIngredient()]
  );

  // Calculate nutrition preview
  const nutrition = useMemo(() => {
    if (ingredients.length === 0 || yieldWeight <= 0) {
      return {
        caloriesPer100g: 0,
        proteinPer100g: 0,
        carbsPer100g: 0,
        fatPer100g: 0,
        fiberPer100g: 0,
      };
    }
    return calculateRecipeNutrition(ingredients, yieldWeight);
  }, [ingredients, yieldWeight]);

  // Calculate suggested yield weight
  const suggestedYield = useMemo(() => {
    return calculateTotalIngredientWeight(ingredients);
  }, [ingredients]);

  // Get non-percentage ingredients for base selection
  const baseIngredients = useMemo(() => {
    return ingredients
      .filter((i) => !i.isPercentage && i.name.trim())
      .map((i) => ({ id: i.id, name: i.name }));
  }, [ingredients]);

  const createMutation = trpc.recipe.create.useMutation({
    onSuccess: () => {
      toast.success("Recipe created successfully!");
      utils.recipe.list.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/recipes");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create recipe");
    },
  });

  const updateMutation = trpc.recipe.update.useMutation({
    onSuccess: () => {
      toast.success("Recipe updated successfully!");
      utils.recipe.list.invalidate();
      utils.recipe.getById.invalidate({ id: initialData?.id });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/recipes");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update recipe");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!name.trim()) {
      toast.error("Please enter a recipe name");
      return;
    }

    const validIngredients = ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }

    if (yieldWeight <= 0) {
      toast.error("Please enter a valid yield weight");
      return;
    }

    // Check percentage ingredients have base
    const invalidPercentages = validIngredients.filter(
      (i) => i.isPercentage && !i.baseIngredientId
    );
    if (invalidPercentages.length > 0) {
      toast.error("Percentage ingredients must have a base ingredient selected");
      return;
    }

    const recipeData = {
      name: name.trim(),
      description: description.trim() || undefined,
      yieldWeight,
      yieldUnit,
      ingredients: validIngredients.map((ing, index) => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit as "g" | "kg" | "ml" | "L" | "%",
        isPercentage: ing.isPercentage,
        baseIngredientId: ing.baseIngredientId,
        caloriesPer100g: ing.caloriesPer100g,
        proteinPer100g: ing.proteinPer100g,
        carbsPer100g: ing.carbsPer100g,
        fatPer100g: ing.fatPer100g,
        fiberPer100g: ing.fiberPer100g,
        isManualEntry: ing.isManualEntry,
        openFoodFactsId: ing.openFoodFactsId,
        sortOrder: index,
      })),
    };

    if (mode === "edit" && initialData?.id) {
      updateMutation.mutate({ id: initialData.id, data: recipeData });
    } else {
      createMutation.mutate(recipeData);
    }
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
  };

  const updateIngredient = (id: string, updated: IngredientData) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? updated : ing))
    );
  };

  const deleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    // Clear base references to deleted ingredient
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.baseIngredientId === id
          ? { ...ing, baseIngredientId: null }
          : ing
      )
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-serif">
          {mode === "edit" ? "Edit Recipe" : "Create Recipe"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipe Name */}
          <div className="space-y-2">
            <Label>Recipe Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Homemade Bread"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the recipe..."
              rows={2}
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  index={index}
                  baseIngredients={baseIngredients.filter(
                    (b) => b.id !== ingredient.id
                  )}
                  onChange={(updated) => updateIngredient(ingredient.id, updated)}
                  onDelete={() => deleteIngredient(ingredient.id)}
                />
              ))}
            </AnimatePresence>

            {ingredients.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 text-muted-foreground"
              >
                <p className="text-sm">No ingredients added yet</p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={addIngredient}
                >
                  Add your first ingredient
                </Button>
              </motion.div>
            )}
          </div>

          {/* Yield Weight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Yield (finished product weight)</Label>
              {suggestedYield > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={() => setYieldWeight(suggestedYield)}
                >
                  Use {suggestedYield}g (sum of ingredients)
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={yieldWeight}
                onChange={(e) => setYieldWeight(Number(e.target.value))}
                placeholder="e.g., 1700"
                className="flex-1"
                min={1}
                required
              />
              <Select value={yieldUnit} onValueChange={setYieldUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              This is the total weight after cooking/preparation. It may differ from the sum of ingredients due to water loss, rising, etc.
            </p>
          </div>

          {/* Nutrition Preview */}
          {yieldWeight > 0 && ingredients.some((i) => i.name.trim()) && (
            <NutritionPreview
              caloriesPer100g={nutrition.caloriesPer100g}
              proteinPer100g={nutrition.proteinPer100g}
              carbsPer100g={nutrition.carbsPer100g}
              fatPer100g={nutrition.fatPer100g}
              fiberPer100g={nutrition.fiberPer100g}
            />
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "edit" ? "Updating..." : "Creating..."}
              </>
            ) : mode === "edit" ? (
              "Update Recipe"
            ) : (
              "Create Recipe"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
