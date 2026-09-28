import Dexie from 'dexie'
import { NOTIFICATION_TIMES_KEY } from './settingsSchema'

export const db = new Dexie('hongik-fridge')

db.version(1).stores({
  foods: 'id, startDate',
})

db.version(2).stores({
  foods: 'id, startDate',
  settings: 'key',
})

db.version(3).stores({
  foods: 'id, startDate',
  settings: 'key',
}).upgrade(async (transaction) => {
  const settings = transaction.table('settings')
  const notificationSetting = await settings.get(NOTIFICATION_TIMES_KEY)

  if (!Array.isArray(notificationSetting?.value)) return

  await settings.put({
    ...notificationSetting,
    value: notificationSetting.value.map((notification) => ({
      ...notification,
      id: typeof notification.id === 'string' && notification.id
        ? notification.id
        : crypto.randomUUID(),
    })),
  })
})
