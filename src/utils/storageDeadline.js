const DAY_MS = 24 * 60 * 60 * 1000

export function getExpiryDate(startDate, storageDays = 7) {
  const expiry = dateNumber(startDate) + storageDays * DAY_MS
  return Number.isFinite(expiry) ? new Date(expiry).toISOString().slice(0, 10) : ''
}

function dateNumber(dateText) {
  return Date.parse(`${dateText}T00:00:00Z`)
}

export function getDaysRemaining(startDate, today, storageDays = 7) {
  const elapsedDays = Math.round(
    (dateNumber(today) - dateNumber(startDate)) / DAY_MS,
  )

  return storageDays - elapsedDays
}
