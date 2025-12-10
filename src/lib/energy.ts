export type EnergyUnit = "KCAL" | "KJ";

// Conversion factor: 1 kcal = 4.184 kJ
const KCAL_TO_KJ = 4.184;

/**
 * Convert energy value based on target unit
 * All internal values are stored in kcal, this converts for display
 */
export function convertEnergy(kcal: number, unit: EnergyUnit): number {
  if (unit === "KJ") {
    return Math.round(kcal * KCAL_TO_KJ);
  }
  return Math.round(kcal);
}

/**
 * Get the display label for the energy unit
 */
export function getEnergyLabel(unit: EnergyUnit): string {
  return unit === "KJ" ? "kJ" : "kcal";
}

/**
 * Format energy value with unit
 */
export function formatEnergy(kcal: number, unit: EnergyUnit): string {
  return `${convertEnergy(kcal, unit)} ${getEnergyLabel(unit)}`;
}

/**
 * Get the opposite unit for toggling
 */
export function getOppositeUnit(unit: EnergyUnit): EnergyUnit {
  return unit === "KCAL" ? "KJ" : "KCAL";
}
