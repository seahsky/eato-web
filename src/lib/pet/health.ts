export type PetHealthState = "thriving" | "healthy" | "okay" | "struggling"

export function getPetHealthState(daysOnGoal: number): PetHealthState {
  if (daysOnGoal >= 6) return "thriving"
  if (daysOnGoal >= 4) return "healthy"
  if (daysOnGoal >= 2) return "okay"
  return "struggling"
}

export function countDaysOnGoal(
  dailyLogs: { goalMet: boolean }[]
): number {
  return dailyLogs.filter(log => log.goalMet).length
}
