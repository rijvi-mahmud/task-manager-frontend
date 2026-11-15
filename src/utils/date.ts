/** Formats an ISO date (yyyy-mm-dd) as a local date, avoiding UTC day shifts. */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
