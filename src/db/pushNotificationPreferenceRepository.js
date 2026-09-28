import { db } from './database'
import {
  PUSH_NOTIFICATIONS_DISABLE_PENDING_KEY,
  PUSH_NOTIFICATIONS_ENABLED_KEY,
} from './settingsSchema'

export async function getPushNotificationPreference() {
  const [enabledSetting, disablePendingSetting] = await Promise.all([
    db.settings.get(PUSH_NOTIFICATIONS_ENABLED_KEY),
    db.settings.get(PUSH_NOTIFICATIONS_DISABLE_PENDING_KEY),
  ])

  return {
    enabled: typeof enabledSetting?.value === 'boolean'
      ? enabledSetting.value
      : null,
    disablePending: disablePendingSetting?.value === true,
  }
}

export async function setPushNotificationPreference({ enabled, disablePending }) {
  const updatedAt = new Date().toISOString()
  await db.settings.bulkPut([
    {
      key: PUSH_NOTIFICATIONS_ENABLED_KEY,
      value: enabled,
      updatedAt,
    },
    {
      key: PUSH_NOTIFICATIONS_DISABLE_PENDING_KEY,
      value: disablePending,
      updatedAt,
    },
  ])
}
