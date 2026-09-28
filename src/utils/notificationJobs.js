import { getExpiryDate } from './storageDeadline.js'

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_JOB_FUTURE_MS = 32 * DAY_MS
const MAX_JOBS = 300
const KOREA_TIME_ZONE_OFFSET = '+09:00'

function shiftDate(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getScheduledAt(expiryDate, { daysBefore, dayHour }) {
  const notificationDate = shiftDate(expiryDate, -daysBefore)
  const hour = String(dayHour).padStart(2, '0')

  return Date.parse(`${notificationDate}T${hour}:00:00${KOREA_TIME_ZONE_OFFSET}`)
}

function getNotificationBody(food, daysBefore) {
  return daysBefore === 0
    ? `${food.name}의 보관 기한이 오늘까지예요.`
    : `${food.name}의 보관 기한이 ${daysBefore}일 남았어요.`
}

function getGroupedNotificationBody(entries) {
  const [{ food, notification }] = entries

  if (entries.length === 1) {
    return getNotificationBody(food, notification.daysBefore)
  }

  return `${food.name} 외 ${entries.length - 1}개의 보관 기한을 확인해 주세요.`
}

function getContentHash(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function buildNotificationJobs({
  foods,
  storageDays,
  notificationTimes,
  now = Date.now(),
}) {
  const latestAllowedTime = now + MAX_JOB_FUTURE_MS
  const entriesByScheduledAt = new Map()

  for (const food of foods) {
    const expiryDate = getExpiryDate(food.startDate, storageDays)

    for (const notification of notificationTimes) {
      const scheduledAt = getScheduledAt(expiryDate, notification)
      if (scheduledAt <= now || scheduledAt > latestAllowedTime) continue

      const entries = entriesByScheduledAt.get(scheduledAt) ?? []
      entries.push({ food, notification })
      entriesByScheduledAt.set(scheduledAt, entries)
    }
  }

  return Array.from(entriesByScheduledAt, ([scheduledAt, entries]) => {
    const [{ food, notification }] = entries
    const isGrouped = entries.length > 1
    const body = getGroupedNotificationBody(entries)
    const contentHash = getContentHash(JSON.stringify(entries.map((entry) => ({
      foodId: entry.food.id,
      name: entry.food.name,
      notificationId: entry.notification.id,
    }))))

    return {
      id: isGrouped
        ? `group:${scheduledAt}:${contentHash}`
        : `${food.id}:${notification.id}:${scheduledAt}:${contentHash}`,
      foodId: food.id,
      notificationId: isGrouped
        ? `group-${scheduledAt}`
        : notification.id,
      scheduledAt,
      title: '보관 기한을 확인해 주세요',
      body,
      url: '/',
    }
  })
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, MAX_JOBS)
}
