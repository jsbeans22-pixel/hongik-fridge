export function getFoodStatusColor(days) {
  if (days <= 1) return '#f04452'
  if (days <= 3) return '#f59e0b'
  if (days <= 5) return '#1da462'
  return '#3182f6'
}
