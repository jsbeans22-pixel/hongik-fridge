export const STORAGE_DAYS_KEY = 'storageDays'
export const NOTIFICATION_TIMES_KEY = 'notificationTimes'
export const DEVICE_ID_KEY = 'deviceId'
export const PUSH_NOTIFICATIONS_ENABLED_KEY = 'pushNotificationsEnabled'
export const PUSH_NOTIFICATIONS_DISABLE_PENDING_KEY = 'pushNotificationsDisablePending'
export const ACTIVE_NOTIFICATION_JOB_IDS_KEY = 'activeNotificationJobIds'
export const NOTIFICATION_SCHEDULE_DIRTY_KEY = 'notificationScheduleDirty'
export const NOTIFICATION_SYNC_OUTBOX_KEY = 'notificationSyncOutbox'

export const DEFAULT_STORAGE_DAYS = 7
export const MIN_STORAGE_DAYS = 1
export const MAX_STORAGE_DAYS = 30

export const MAX_NOTIFICATION_COUNT = 3
export const MAX_NOTIFICATION_DAYS_BEFORE = 7

export const DEFAULT_NOTIFICATION_TIMES = [
  { id: 'default-notification-day-0-hour-22', daysBefore: 0, dayHour: 22 },
  { id: 'default-notification-day-1-hour-23', daysBefore: 1, dayHour: 23 },
]

export function isValidStorageDays(value) {
  return Number.isInteger(value) &&
    value >= MIN_STORAGE_DAYS &&
    value <= MAX_STORAGE_DAYS
}

export function isValidNotificationTime(value) {
  return typeof value?.id === 'string' &&
    value.id.length > 0 &&
    Number.isInteger(value.daysBefore) &&
    value.daysBefore >= 0 &&
    value.daysBefore <= MAX_NOTIFICATION_DAYS_BEFORE &&
    Number.isInteger(value.dayHour) &&
    value.dayHour >= 0 &&
    value.dayHour <= 23
}

function isLegacyNotificationTime(value) {
  return Number.isInteger(value?.hours) &&
    value.hours >= 1 &&
    value.hours <= MAX_NOTIFICATION_DAYS_BEFORE * 24 &&
    Number.isInteger(value.dayHour) &&
    value.dayHour >= 0 &&
    value.dayHour <= 23
}

export function normalizeNotificationTimes(value) {
  if (!Array.isArray(value)) return []

  return value.map((notification) => {
    const id = typeof notification?.id === 'string' && notification.id
      ? notification.id
      : crypto.randomUUID()

    if (isValidNotificationTime(notification)) return { ...notification }
    if (!isLegacyNotificationTime(notification)) return { ...notification, id }

    if (notification.hours < 24) {
      return {
        id,
        daysBefore: 0,
        dayHour: (24 - notification.hours) % 24,
      }
    }

    return {
      id,
      daysBefore: Math.min(MAX_NOTIFICATION_DAYS_BEFORE, notification.hours / 24),
      dayHour: notification.dayHour,
    }
  })
}

function notificationTimeKey({ daysBefore, dayHour }) {
  return `${daysBefore}-${dayHour}`
}

export function isValidNotificationTimes(value) {
  return Array.isArray(value) &&
    value.length <= MAX_NOTIFICATION_COUNT &&
    value.every(isValidNotificationTime) &&
    new Set(value.map(({ id }) => id)).size === value.length &&
    new Set(value.map(notificationTimeKey)).size === value.length
}
