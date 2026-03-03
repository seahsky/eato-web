/** Format a Date to YYYY-MM-DD string */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Add/subtract days from a date */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Check if a date is today */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

/** Format a date for display (e.g., "Mon, Jan 1") */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Get the start of a week (Sunday) for a given date */
export function getWeekStart(date: Date, weekStartDay = 0): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day - weekStartDay + 7) % 7
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}
