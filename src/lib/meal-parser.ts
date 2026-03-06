/**
 * Meal parser utilities
 * Parses ingredient lines from textarea input (e.g., "200g flour" or "352kj salmon")
 */

import { convertToGrams } from "./recipe-calculator";
import { convertToKcal } from "./energy";

export interface ParsedIngredient {
  id: string;
  rawLine: string;
  quantity: number;
  unit: string; // "g", "kg", "ml", "l", "kj", "kcal", "cal"
  normalizedGrams: number;
  ingredientName: string;
  parseError?: string;
  isDirectEnergy?: boolean;
  directCalories?: number; // Always stored in kcal
}

// Regex to match: number + optional unit + ingredient name
// Examples: "200g flour", "1.5kg chicken", "100 ml oil", "50 sugar" (no unit = grams)
const INGREDIENT_REGEX = /^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)?\s+(.+)$/i;

// Regex to match: number + energy unit + food name
// Examples: "352kj canned salmon", "500kcal pizza", "200cal banana"
const ENERGY_REGEX = /^(\d+(?:\.\d+)?)\s*(kj|kcal|cal)\s+(.+)$/i;

/**
 * Parse a single ingredient line
 */
function parseIngredientLine(line: string, index: number): ParsedIngredient | null {
  const trimmed = line.trim();

  // Skip empty lines
  if (!trimmed) {
    return null;
  }

  // Try weight-based pattern first
  const weightMatch = trimmed.match(INGREDIENT_REGEX);

  if (weightMatch) {
    const quantity = parseFloat(weightMatch[1]);
    const unit = (weightMatch[2] || "g").toLowerCase();
    const ingredientName = weightMatch[3].trim();

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

  // Try energy-based pattern
  const energyMatch = trimmed.match(ENERGY_REGEX);

  if (energyMatch) {
    const value = parseFloat(energyMatch[1]);
    const energyUnit = energyMatch[2].toLowerCase();
    const ingredientName = energyMatch[3].trim();

    // Validate energy value
    if (isNaN(value) || value <= 0) {
      return {
        id: `ing-${index}`,
        rawLine: trimmed,
        quantity: 0,
        unit: energyUnit,
        normalizedGrams: 0,
        ingredientName,
        parseError: "Invalid energy value",
      };
    }

    // Convert to kcal (internal storage unit)
    let kcal = value;
    if (energyUnit === "kj") {
      kcal = convertToKcal(value, "KJ");
    }
    // 'cal' and 'kcal' are treated as kcal

    return {
      id: `ing-${index}`,
      rawLine: trimmed,
      quantity: value,
      unit: energyUnit,
      normalizedGrams: 0,
      ingredientName,
      isDirectEnergy: true,
      directCalories: kcal,
    };
  }

  // No match - return error
  return {
    id: `ing-${index}`,
    rawLine: trimmed,
    quantity: 0,
    unit: "g",
    normalizedGrams: 0,
    ingredientName: trimmed,
    parseError: "Invalid format. Use: 200g flour or 352kj salmon",
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
