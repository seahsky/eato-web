/**
 * Meal parser utilities
 * Parses ingredient lines from textarea input (e.g., "200g flour")
 */

import { convertToGrams } from "./recipe-calculator";

export interface ParsedIngredient {
  id: string;
  rawLine: string;
  quantity: number;
  unit: string; // "g", "kg", "ml", "l"
  normalizedGrams: number;
  ingredientName: string;
  parseError?: string;
}

// Regex to match: number + optional unit + ingredient name
// Examples: "200g flour", "1.5kg chicken", "100 ml oil", "50 sugar" (no unit = grams)
const INGREDIENT_REGEX = /^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)?\s+(.+)$/i;

/**
 * Parse a single ingredient line
 */
function parseIngredientLine(line: string, index: number): ParsedIngredient | null {
  const trimmed = line.trim();

  // Skip empty lines
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(INGREDIENT_REGEX);

  if (!match) {
    return {
      id: `ing-${index}`,
      rawLine: trimmed,
      quantity: 0,
      unit: "g",
      normalizedGrams: 0,
      ingredientName: trimmed,
      parseError: "Invalid format. Use: 200g flour",
    };
  }

  const quantity = parseFloat(match[1]);
  const unit = (match[2] || "g").toLowerCase();
  const ingredientName = match[3].trim();

  // Validate quantity
  if (isNaN(quantity) || quantity <= 0) {
    return {
      id: `ing-${index}`,
      rawLine: trimmed,
      quantity: 0,
      unit: "g",
      normalizedGrams: 0,
      ingredientName,
      parseError: "Invalid quantity",
    };
  }

  const normalizedGrams = convertToGrams(quantity, unit);

  return {
    id: `ing-${index}`,
    rawLine: trimmed,
    quantity,
    unit,
    normalizedGrams,
    ingredientName,
  };
}

/**
 * Parse multiple ingredient lines from textarea input
 */
export function parseIngredientLines(text: string): ParsedIngredient[] {
  const lines = text.split("\n");
  const parsed: ParsedIngredient[] = [];

  lines.forEach((line, index) => {
    const result = parseIngredientLine(line, index);
    if (result) {
      parsed.push(result);
    }
  });

  return parsed;
}

/**
 * Format grams for display (e.g., 1500 -> "1.5kg", 200 -> "200g")
 */
export function formatGrams(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1).replace(/\.0$/, "")}kg`;
  }
  return `${Math.round(grams)}g`;
}
