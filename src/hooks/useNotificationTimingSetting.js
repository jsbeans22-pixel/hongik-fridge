import { useState } from 'react'
import {
  MAX_NOTIFICATION_DAYS_BEFORE,
  MAX_NOTIFICATION_COUNT,
  saveNotificationTimes,
} from '../db/notificationSettingsRepository'
import { useDbAction } from './useDbAction'
import { useNotificationTimes } from './useNotificationTimes'
import { sortNotificationTimes } from '../utils/notificationTime'

const DEFAULT_NEW_NOTIFICATION_HOUR = 9

export function useNotificationTimingSetting(storageDays, onTimesSaved) {
  const notificationTimes = useNotificationTimes()
  const maxDaysBefore = Math.min(MAX_NOTIFICATION_DAYS_BEFORE, storageDays)
  const [isOpen, setIsOpen] = useState(false)
  const [draftTimes, setDraftTimes] = useState(notificationTimes)
  const { run, isPending, error, clearError } = useDbAction()

  function open() {
    clearError()
    setDraftTimes(notificationTimes.map((notification) => ({ ...notification })))
    setIsOpen(true)
  }

  function close() {
    if (!isPending) setIsOpen(false)
  }

  function decreaseCount() {
    setDraftTimes((times) => times.slice(0, -1))
  }

  function increaseCount() {
    setDraftTimes((times) => {
      const taken = new Set(times.map(({ daysBefore, dayHour }) => `${daysBefore}-${dayHour}`))
      const candidates = Array.from({ length: maxDaysBefore + 1 }, (_, day) => day)
        .flatMap((daysBefore) => Array.from({ length: 24 }, (_, offset) => ({
          daysBefore,
          dayHour: (DEFAULT_NEW_NOTIFICATION_HOUR + offset) % 24,
        })))
      const next = candidates.find(({ daysBefore, dayHour }) => (
        !taken.has(`${daysBefore}-${dayHour}`)
      )) ?? { daysBefore: 0, dayHour: DEFAULT_NEW_NOTIFICATION_HOUR }

      return [...times, { ...next, id: crypto.randomUUID() }]
    })
  }

  function adjustDaysBefore(id, direction) {
    setDraftTimes((times) => {
      const notification = times.find((current) => current.id === id)
      if (!notification) return times

      const otherKeys = new Set(times
        .filter((current) => current.id !== id)
        .map(({ daysBefore, dayHour }) => `${daysBefore}-${dayHour}`))
      let next = notification.daysBefore + direction

      while (
        next >= 0 &&
        next <= maxDaysBefore &&
        otherKeys.has(`${next}-${notification.dayHour}`)
      ) {
        next += direction
      }

      if (next < 0 || next > maxDaysBefore) {
        next = notification.daysBefore
      }

      return times.map((current) => (
        current.id === id ? { ...current, daysBefore: next } : current
      ))
    })
  }

  function adjustDayHour(id, direction) {
    setDraftTimes((times) => {
      const notification = times.find((current) => current.id === id)
      if (!notification) return times

      const otherKeys = new Set(times
        .filter((current) => current.id !== id)
        .map(({ daysBefore, dayHour }) => `${daysBefore}-${dayHour}`))
      let next = (notification.dayHour + direction + 24) % 24

      while (otherKeys.has(`${notification.daysBefore}-${next}`)) {
        next = (next + direction + 24) % 24
      }

      return times.map((current) => (
        current.id === id ? { ...current, dayHour: next } : current
      ))
    })
  }

  function save() {
    const sortedTimes = sortNotificationTimes(draftTimes)
    run(async () => {
      await saveNotificationTimes(sortedTimes)
      await onTimesSaved?.(sortedTimes)
    }, () => setIsOpen(false))
  }

  return {
    notificationTimes,
    draftTimes,
    isOpen,
    isPending,
    error,
    canDecreaseCount: draftTimes.length > 0,
    canIncreaseCount: draftTimes.length < MAX_NOTIFICATION_COUNT,
    maxDaysBefore,
    open,
    close,
    decreaseCount,
    increaseCount,
    decreaseDaysBefore: (id) => adjustDaysBefore(id, -1),
    increaseDaysBefore: (id) => adjustDaysBefore(id, 1),
    decreaseDayHour: (id) => adjustDayHour(id, -1),
    increaseDayHour: (id) => adjustDayHour(id, 1),
    save,
  }
}
