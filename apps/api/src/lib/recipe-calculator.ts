/**
 * Recipe nutrition calculation utilities
 * Handles baker's percentages and per-100g nutrition calculations
 */

export interface IngredientInput {
  id?: string;
  name: string;
  quantity: number;
  unit: string; // "g", "kg", "ml", "L", "%"
  isPercentage: boolean;
  baseIngredientId?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
}

export interface ResolvedIngredient extends IngredientInput {
  resolvedGrams: number;
}

export interface NutritionPer100g {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/**
 * Convert a quantity with unit to grams
 * Treats 1ml = 1g for simplicity (works for water-based liquids)
 */
export function convertToGrams(quantity: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case "kg":
    case "l":
      return quantity * 1000;
    case "g":
    case "ml":
      return quantity;
    default:
      return quantity;
  }
}

/**
 * Resolve percentage-based ingredients to actual grams
 * Baker's percentages: "2% salt" = 2% of the base ingredient's weight
 */
export function resolvePercentages(
  ingredients: IngredientInput[]
): ResolvedIngredient[] {
  // First pass: resolve non-percentage ingredients
  const resolved: ResolvedIngredient[] = ingredients.map((ing) => {
    if (!ing.isPercentage) {
      return {
        ...ing,
        resolvedGrams: convertToGrams(ing.quantity, ing.unit),
      };
    }
    // Placeholder for percentage ingredients
    return {
      ...ing,
      resolvedGrams: 0,
    };
  });

  // Second pass: resolve percentage ingredients
  return resolved.map((ing) => {
    if (!ing.isPercentage || !ing.baseIngredientId) {
      return ing;
    }

    const baseIngredient = resolved.find(
      (i) => i.id === ing.baseIngredientId && !i.isPercentage
    );

    if (!baseIngredient) {
      // Fallback: treat percentage as grams if no base found
      return {
        ...ing,
        resolvedGrams: ing.quantity,
      };
    }

    // Calculate actual grams: percentage of base ingredient's weight
    const resolvedGrams = (ing.quantity / 100) * baseIngredient.resolvedGrams;
    return {
      ...ing,
      resolvedGrams,
    };
  });
}

/**
 * Calculate total nutrition from all ingredients
 */
export function calculateTotalNutrition(
  ingredients: ResolvedIngredient[]
): NutritionTotals {
  return ingredients.reduce(
    (acc, ing) => {
      const ratio = ing.resolvedGrams / 100;
      return {
        calories: acc.calories + ing.caloriesPer100g * ratio,
        protein: acc.protein + ing.proteinPer100g * ratio,
        carbs: acc.carbs + ing.carbsPer100g * ratio,
        fat: acc.fat + ing.fatPer100g * ratio,
        fiber: acc.fiber + ing.fiberPer100g * ratio,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/**
 * Calculate per-100g nutrition based on total nutrition and yield weight
 */
export function calculatePer100gNutrition(
  totals: NutritionTotals,
  yieldWeight: number
): NutritionPer100g {
  if (yieldWeight <= 0) {
    return {
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      fiberPer100g: 0,
    };
  }

  const factor = 100 / yieldWeight;
  return {
    caloriesPer100g: Math.round(totals.calories * factor * 10) / 10,
    proteinPer100g: Math.round(totals.protein * factor * 10) / 10,
    carbsPer100g: Math.round(totals.carbs * factor * 10) / 10,
    fatPer100g: Math.round(totals.fat * factor * 10) / 10,
    fiberPer100g: Math.round(totals.fiber * factor * 10) / 10,
  };
}

/**
 * Main function: Calculate recipe nutrition from ingredients and yield
 */
export function calculateRecipeNutrition(
  ingredients: IngredientInput[],
  yieldWeight: number
): NutritionPer100g {
  const resolved = resolvePercentages(ingredients);
  const totals = calculateTotalNutrition(resolved);
  return calculatePer100gNutrition(totals, yieldWeight);
}

/**
 * Calculate nutrition for a consumed portion of a recipe
 */
export function calculatePortionNutrition(
  recipePer100g: NutritionPer100g,
  consumedWeight: number
): NutritionTotals {
  const ratio = consumedWeight / 100;
  return {
    calories: Math.round(recipePer100g.caloriesPer100g * ratio),
    protein: Math.round(recipePer100g.proteinPer100g * ratio * 10) / 10,
    carbs: Math.round(recipePer100g.carbsPer100g * ratio * 10) / 10,
    fat: Math.round(recipePer100g.fatPer100g * ratio * 10) / 10,
    fiber: Math.round(recipePer100g.fiberPer100g * ratio * 10) / 10,
  };
}

/**
 * Calculate total weight of all ingredients (after resolving percentages)
 * Useful for suggesting yield weight
 */
export function calculateTotalIngredientWeight(
  ingredients: IngredientInput[]
): number {
  const resolved = resolvePercentages(ingredients);
  return Math.round(
    resolved.reduce((sum, ing) => sum + ing.resolvedGrams, 0)
  );
}
