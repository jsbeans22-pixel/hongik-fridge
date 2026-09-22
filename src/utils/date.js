export function getTodayInKorea() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const getPart = (type) =>
    parts.find((part) => part.type === type).value

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`
}