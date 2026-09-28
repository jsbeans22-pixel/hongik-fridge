import { db } from './database'
import { getTodayInKorea } from '../utils/date'
import { getDaysRemaining } from '../utils/storageDeadline'
import { getStorageDays } from './storageSettingsRepository'
import { markNotificationScheduleDirty } from './notificationDeliveryStateRepository'

export function renewFood(id, startDate) {
  return db.transaction('rw', db.foods, db.settings, async () => {
    const food = await db.foods.get(id)
    if (!food) throw new Error('이미 삭제된 음식이에요.')
    const storageDays = await getStorageDays()
    if (getDaysRemaining(food.startDate, getTodayInKorea(), storageDays) === storageDays) {
      throw new Error(`보관기간이 ${storageDays}일 남아 있어 아직 갱신할 수 없어요.`)
    }
    const validated = validateFood({ ...food, startDate })
    await db.foods.update(id, {
      startDate: validated.startDate,
      updatedAt: new Date().toISOString(),
    })
    await markNotificationScheduleDirty()
  })
}

function validateFood(values) {
  const name = values.name?.trim()

  if (!name || name.length > 80) {
    throw new Error('음식 이름은 1~80자로 입력해주세요.')
  }

  if (!Number.isInteger(values.quantity) ||
      values.quantity < 1 ||
      values.quantity > 99) {
    throw new Error('수량은 1~99개로 입력해주세요.')
  }

  if (!['냉장', '냉동'].includes(values.storageType)) {
    throw new Error('보관 방식을 선택해주세요.')
  }

  const dateText = values.startDate
  const date = new Date(`${dateText}T00:00:00Z`)

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateText ?? '') ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateText
  ) {
    throw new Error('보관 시작일을 확인해주세요.')
  }

  if (dateText > getTodayInKorea()) {
    throw new Error('보관 시작일은 오늘 또는 이전 날짜로 선택해주세요.')
  }

  return {
    name,
    quantity: values.quantity,
    storageType: values.storageType,
    startDate: dateText,
    icon: values.icon || '🫙',
    autoIcon: Boolean(values.autoIcon),
  }
}

export function getFoods() {
  return db.foods.orderBy('startDate').toArray()
}

export function addFood(values) {
  const food = validateFood(values)
  const now = new Date().toISOString()

  return db.transaction('rw', db.foods, db.settings, async () => {
    const id = await db.foods.add({
      ...food,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    await markNotificationScheduleDirty()
    return id
  })
}

export async function updateFood(id, values) {
  const food = validateFood(values)

  const updatedCount = await db.transaction('rw', db.foods, db.settings, async () => {
    const count = await db.foods.update(id, {
      ...food,
      updatedAt: new Date().toISOString(),
    })
    if (count > 0) await markNotificationScheduleDirty()
    return count
  })

  if (updatedCount === 0) {
    throw new Error('음식을 찾을 수 없어요. 목록을 확인해주세요.')
  }
}

export function deleteFood(id) {
  return db.transaction('rw', db.foods, db.settings, async () => {
    await db.foods.delete(id)
    await markNotificationScheduleDirty()
  })
}

export function consumeFood(id, quantity) {
  return db.transaction('rw', db.foods, db.settings, async () => {
    const food = await db.foods.get(id)

    if (!food) {
      throw new Error('이미 삭제된 음식이에요.')
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > food.quantity
    ) {
      throw new Error('현재 남은 수량을 확인해주세요.')
    }

    const remaining = food.quantity - quantity

    if (remaining === 0) {
      await db.foods.delete(id)
      await markNotificationScheduleDirty()
      return
    }

    await db.foods.update(id, {
      quantity: remaining,
      updatedAt: new Date().toISOString(),
    })
  })
}
