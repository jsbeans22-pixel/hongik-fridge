export function formatNotificationDay(daysBefore) {
  if (daysBefore === 0) return '당일'
  return `${daysBefore}일 전`
}

export function formatNotificationDayHour(hour) {
  if (hour === 0) return '오전 12시'
  if (hour < 12) return `오전 ${hour}시`
  if (hour === 12) return '오후 12시'
  return `오후 ${hour - 12}시`
}

export function formatNotificationSummary(notification) {
  return `${formatNotificationDay(notification.daysBefore)} ${formatNotificationDayHour(notification.dayHour)}`
}

export function sortNotificationTimes(notificationTimes) {
  return [...notificationTimes].sort((a, b) => (
    a.daysBefore - b.daysBefore || b.dayHour - a.dayHour
  ))
}
