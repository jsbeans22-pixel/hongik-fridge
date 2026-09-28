import { useState } from 'react'
import {
  MAX_STORAGE_DAYS,
  MIN_STORAGE_DAYS,
  saveStorageDays,
} from '../db/storageSettingsRepository'
import { useDbAction } from './useDbAction'
import { useStorageDays } from './useStorageDays'

export function useStorageDeadlineSetting() {
  const storageDays = useStorageDays()
  const [isOpen, setIsOpen] = useState(false)
  const [draftDays, setDraftDays] = useState(storageDays)
  const { run, isPending, error, clearError } = useDbAction()

  function open() {
    clearError()
    setDraftDays(storageDays)
    setIsOpen(true)
  }

  function close() {
    if (!isPending) setIsOpen(false)
  }

  function decrease() {
    setDraftDays((days) => Math.max(MIN_STORAGE_DAYS, days - 1))
  }

  function increase() {
    setDraftDays((days) => Math.min(MAX_STORAGE_DAYS, days + 1))
  }

  function save() {
    run(() => saveStorageDays(draftDays), () => setIsOpen(false))
  }

  return {
    storageDays,
    draftDays,
    isOpen,
    isPending,
    error,
    open,
    close,
    decrease,
    increase,
    save,
  }
}
