import { EnergyUnit } from '../api/types'

const KJ_PER_KCAL = 4.184

/** Convert kcal to the target unit */
export function convertEnergy(kcal: number, unit: EnergyUnit): number {
  if (unit === EnergyUnit.KJ) return Math.round(kcal * KJ_PER_KCAL)
  return Math.round(kcal)
}

/** Format energy with unit label */
export function formatEnergy(kcal: number, unit: EnergyUnit): string {
  const value = convertEnergy(kcal, unit)
  return `${value} ${unit === EnergyUnit.KJ ? 'kJ' : 'kcal'}`
}
