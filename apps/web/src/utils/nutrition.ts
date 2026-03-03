/** Calculate nutrition for a given serving size from per-100g values */
export function calculatePerServing(
  per100g: number,
  servingSize: number,
  servingUnit: string,
): number {
  // If unit is grams, straightforward ratio
  if (servingUnit === 'g' || servingUnit === 'ml') {
    return (per100g * servingSize) / 100
  }
  // For other units, assume servingSize is already the final value
  return per100g * servingSize / 100
}

/** Round a nutrition value to 1 decimal place */
export function roundNutrition(value: number): number {
  return Math.round(value * 10) / 10
}
