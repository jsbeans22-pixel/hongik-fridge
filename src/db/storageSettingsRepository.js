import { db } from './database'
import { sortNotificationTimes } from '../utils/notificationTime'
import {
  DEFAULT_STORAGE_DAYS,
  MAX_STORAGE_DAYS,
  MIN_STORAGE_DAYS,
  NOTIFICATION_TIMES_KEY,
  STORAGE_DAYS_KEY,
  isValidStorageDays,
  normalizeNotificationTimes,
} from './settingsSchema'
import { markNotificationScheduleDirty } from './notificationDeliveryStateRepository'

export {
  DEFAULT_STORAGE_DAYS,
  MAX_STORAGE_DAYS,
  MIN_STORAGE_DAYS,
}

export async function getStorageDays() {
  const setting = await db.settings.get(STORAGE_DAYS_KEY)
  return isValidStorageDays(setting?.value)
    ? setting.value
    : DEFAULT_STORAGE_DAYS
}

export function saveStorageDays(value) {
  if (!isValidStorageDays(value)) {
    throw new Error(`보관 기한은 ${MIN_STORAGE_DAYS}~${MAX_STORAGE_DAYS}일로 설정해주세요.`)
  }

  return db.transaction('rw', db.settings, async () => {
    const now = new Date().toISOString()
    const notificationSetting = await db.settings.get(NOTIFICATION_TIMES_KEY)

    await db.settings.put({
      key: STORAGE_DAYS_KEY,
      value,
      updatedAt: now,
    })

    if (Array.isArray(notificationSetting?.value)) {
      const availableNotificationTimes = normalizeNotificationTimes(notificationSetting.value)
        .filter(({ daysBefore }) => daysBefore <= value)

      await db.settings.put({
        key: NOTIFICATION_TIMES_KEY,
        value: sortNotificationTimes(availableNotificationTimes),
        updatedAt: now,
      })
    }

    await markNotificationScheduleDirty()
  })
}
