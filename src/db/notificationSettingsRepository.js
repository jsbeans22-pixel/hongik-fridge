import { db } from './database'
import { sortNotificationTimes } from '../utils/notificationTime'
import { getStorageDays } from './storageSettingsRepository'
import { markNotificationScheduleDirty } from './notificationDeliveryStateRepository'
import {
  DEFAULT_NOTIFICATION_TIMES,
  MAX_NOTIFICATION_COUNT,
  MAX_NOTIFICATION_DAYS_BEFORE,
  NOTIFICATION_TIMES_KEY,
  isValidNotificationTimes,
  normalizeNotificationTimes,
} from './settingsSchema'

export {
  DEFAULT_NOTIFICATION_TIMES,
  MAX_NOTIFICATION_COUNT,
  MAX_NOTIFICATION_DAYS_BEFORE,
}

export async function getNotificationTimes() {
  const [setting, storageDays] = await Promise.all([
    db.settings.get(NOTIFICATION_TIMES_KEY),
    getStorageDays(),
  ])
  const storedValue = setting?.value

  if (!Array.isArray(storedValue)) {
    return DEFAULT_NOTIFICATION_TIMES.map((notification) => ({ ...notification }))
  }

  const notificationTimes = normalizeNotificationTimes(storedValue)

  if (!isValidNotificationTimes(notificationTimes)) {
    return DEFAULT_NOTIFICATION_TIMES.map((notification) => ({ ...notification }))
  }

  return sortNotificationTimes(
    notificationTimes
      .filter(({ daysBefore }) => daysBefore <= storageDays)
      .map((notification) => ({ ...notification })),
  )
}

export function saveNotificationTimes(value) {
  if (!isValidNotificationTimes(value)) {
    throw new Error('알림을 확인해주세요.')
  }

  return db.transaction('rw', db.settings, async () => {
    const storageDays = await getStorageDays()

    if (value.some(({ daysBefore }) => daysBefore > storageDays)) {
      throw new Error('현재 보관 기한보다 먼 알림은 설정할 수 없어요.')
    }

    await db.settings.put({
      key: NOTIFICATION_TIMES_KEY,
      value: sortNotificationTimes(
        value.map((notification) => ({ ...notification })),
      ),
      updatedAt: new Date().toISOString(),
    })
    await markNotificationScheduleDirty()
  })
}
