import { db } from './database'
import { DEVICE_ID_KEY } from './settingsSchema'

function isValidDeviceId(value) {
  return typeof value === 'string' && value.length > 0
}

export async function getOrCreateDeviceId() {
  return db.transaction('rw', db.settings, async () => {
    const setting = await db.settings.get(DEVICE_ID_KEY)

    if (isValidDeviceId(setting?.value)) return setting.value

    const deviceId = crypto.randomUUID()

    await db.settings.put({
      key: DEVICE_ID_KEY,
      value: deviceId,
      createdAt: new Date().toISOString(),
    })

    return deviceId
  })
}
