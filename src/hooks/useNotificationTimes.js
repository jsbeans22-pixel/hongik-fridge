import { useLiveQuery } from 'dexie-react-hooks'
import {
  DEFAULT_NOTIFICATION_TIMES,
  getNotificationTimes,
} from '../db/notificationSettingsRepository'

export function useNotificationTimes() {
  return useLiveQuery(
    getNotificationTimes,
    [],
    DEFAULT_NOTIFICATION_TIMES.map((notification) => ({ ...notification })),
  )
}
