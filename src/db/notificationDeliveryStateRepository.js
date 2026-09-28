import { db } from './database'
import {
  ACTIVE_NOTIFICATION_JOB_IDS_KEY,
  NOTIFICATION_SCHEDULE_DIRTY_KEY,
  NOTIFICATION_SYNC_OUTBOX_KEY,
} from './settingsSchema'
import { isCurrentNotificationSyncRevision } from '../utils/notificationSyncPolicy'

function setting(key, value, updatedAt) {
  return { key, value, updatedAt }
}

export function markNotificationScheduleDirty(settingsTable = db.settings) {
  const updatedAt = new Date().toISOString()
  const outbox = {
    revision: crypto.randomUUID(),
    queuedAt: updatedAt,
  }

  return settingsTable.bulkPut([
    setting(NOTIFICATION_SCHEDULE_DIRTY_KEY, true, updatedAt),
    setting(NOTIFICATION_SYNC_OUTBOX_KEY, outbox, updatedAt),
  ])
}

export function getNotificationSyncOutbox(settingsTable = db.settings) {
  return settingsTable.get(NOTIFICATION_SYNC_OUTBOX_KEY)
    .then((record) => record?.value ?? null)
}

export function ensureNotificationSyncQueued() {
  return db.transaction('rw', db.settings, async () => {
    const current = await getNotificationSyncOutbox()
    if (current?.revision) return current

    await markNotificationScheduleDirty()
    return getNotificationSyncOutbox()
  })
}

export function acknowledgeNotificationSync(revision, jobIds) {
  return db.transaction('rw', db.settings, async () => {
    const current = await getNotificationSyncOutbox()
    if (!isCurrentNotificationSyncRevision(current, revision)) return false

    const updatedAt = new Date().toISOString()
    await db.settings.bulkPut([
      setting(ACTIVE_NOTIFICATION_JOB_IDS_KEY, jobIds, updatedAt),
      setting(NOTIFICATION_SCHEDULE_DIRTY_KEY, false, updatedAt),
    ])
    await db.settings.delete(NOTIFICATION_SYNC_OUTBOX_KEY)
    return true
  })
}

export function clearNotificationSyncState() {
  return db.transaction('rw', db.settings, async () => {
    const updatedAt = new Date().toISOString()
    await db.settings.bulkPut([
      setting(ACTIVE_NOTIFICATION_JOB_IDS_KEY, [], updatedAt),
      setting(NOTIFICATION_SCHEDULE_DIRTY_KEY, false, updatedAt),
    ])
    await db.settings.delete(NOTIFICATION_SYNC_OUTBOX_KEY)
  })
}
