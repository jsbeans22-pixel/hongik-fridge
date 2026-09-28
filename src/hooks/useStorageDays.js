import { useLiveQuery } from 'dexie-react-hooks'
import {
  DEFAULT_STORAGE_DAYS,
  getStorageDays,
} from '../db/storageSettingsRepository'

export function useStorageDays() {
  return useLiveQuery(getStorageDays, [], DEFAULT_STORAGE_DAYS)
}
