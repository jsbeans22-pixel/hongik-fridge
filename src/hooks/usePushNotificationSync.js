import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getOrCreateDeviceId } from '../db/deviceIdentityRepository'
import { db } from '../db/database'
import { getFoods } from '../db/foodRepository'
import { getNotificationTimes } from '../db/notificationSettingsRepository'
import { getStorageDays } from '../db/storageSettingsRepository'
import {
  acknowledgeNotificationSync,
  ensureNotificationSyncQueued,
  getNotificationSyncOutbox,
} from '../db/notificationDeliveryStateRepository'
import { NOTIFICATION_PERMISSION } from '../services/notificationPermissionService'
import { clearDisplayedNotifications } from '../services/notificationDisplayService'
import {
  syncNotificationState,
} from '../services/pushApiService'
import { getOrCreatePushSubscription } from '../services/pushSubscriptionService'
import { createLatestTaskQueue } from '../utils/latestTaskQueue'
import { buildNotificationJobs } from '../utils/notificationJobs'

const RETRY_BASE_DELAY_MS = 5_000
const RETRY_MAX_DELAY_MS = 5 * 60_000

function getRetryDelay(attempt) {
  return Math.min(
    RETRY_BASE_DELAY_MS * (2 ** Math.min(attempt, 6)),
    RETRY_MAX_DELAY_MS,
  )
}

function useNotificationData() {
  return useLiveQuery(async () => {
    const [foods, storageDays, notificationTimes] = await Promise.all([
      getFoods(),
      getStorageDays(),
      getNotificationTimes(),
    ])

    return { foods, storageDays, notificationTimes }
  }, [])
}

function createSyncFingerprint(data, deviceId) {
  return JSON.stringify({
    deviceId,
    foods: data.foods.map(({ id, name, icon, startDate }) => ({
      id,
      name,
      icon,
      startDate,
    })),
    storageDays: data.storageDays,
    notificationTimes: data.notificationTimes,
  })
}

async function getQueuedNotificationSnapshot() {
  await ensureNotificationSyncQueued()

  return db.transaction('r', db.foods, db.settings, async () => {
    const [foods, storageDays, notificationTimes, outbox] = await Promise.all([
      getFoods(),
      getStorageDays(),
      getNotificationTimes(),
      getNotificationSyncOutbox(),
    ])

    if (!outbox?.revision) {
      throw new Error('알림 동기화 대기열을 준비하지 못했어요.')
    }

    return {
      data: { foods, storageDays, notificationTimes },
      revision: outbox.revision,
    }
  })
}

export function usePushNotificationSync(permission, notificationsEnabled, preferenceReady) {
  const data = useNotificationData()
  const [deviceId, setDeviceId] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState('')
  const [retryRevision, setRetryRevision] = useState(0)
  const isMounted = useRef(true)
  const syncedFingerprint = useRef('')
  const displayedFingerprint = useRef('')
  const retryFingerprint = useRef('')
  const retryAttempts = useRef(0)
  const retryTimer = useRef(null)
  const isManualSyncing = useRef(false)
  const [syncQueue] = useState(() => createLatestTaskQueue({
    onStart() {
      setIsSyncing(true)
    },
    onIdle() {
      setIsSyncing(false)
    },
  }))

  const uploadLatestSchedule = useCallback(async () => {
    const snapshot = await getQueuedNotificationSnapshot()
    const snapshotFingerprint = createSyncFingerprint(snapshot.data, deviceId)
    const subscription = await getOrCreatePushSubscription()
    const jobs = buildNotificationJobs({
      foods: snapshot.data.foods,
      storageDays: snapshot.data.storageDays,
      notificationTimes: snapshot.data.notificationTimes,
    })

    await syncNotificationState(deviceId, subscription.toJSON(), jobs)
    const acknowledged = await acknowledgeNotificationSync(
      snapshot.revision,
      jobs.map(({ id }) => id),
    )

    if (acknowledged) {
      syncedFingerprint.current = snapshotFingerprint
      await clearDisplayedNotifications()
    }

    return { acknowledged, snapshotFingerprint }
  }, [deviceId])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      syncQueue.clear()
      window.clearTimeout(retryTimer.current)
    }
  }, [syncQueue])

  useEffect(() => {
    let isDeviceRequestActive = true

    getOrCreateDeviceId()
      .then((value) => {
        if (isDeviceRequestActive) setDeviceId(value)
      })
      .catch(() => {
        if (isDeviceRequestActive) {
          setError('이 기기의 알림 정보를 준비하지 못했어요.')
        }
      })

    return () => {
      isDeviceRequestActive = false
    }
  }, [])

  useEffect(() => {
    function requestImmediateRetry() {
      window.clearTimeout(retryTimer.current)
      retryTimer.current = null
      retryFingerprint.current = ''
      retryAttempts.current = 0
      setRetryRevision((revision) => revision + 1)
    }

    function retryWhenVisible() {
      if (document.visibilityState === 'visible') requestImmediateRetry()
    }

    window.addEventListener('online', requestImmediateRetry)
    window.addEventListener('focus', requestImmediateRetry)
    document.addEventListener('visibilitychange', retryWhenVisible)

    return () => {
      window.removeEventListener('online', requestImmediateRetry)
      window.removeEventListener('focus', requestImmediateRetry)
      document.removeEventListener('visibilitychange', retryWhenVisible)
    }
  }, [])

  const fingerprint = useMemo(() => {
    if (!data || !deviceId) return ''
    return createSyncFingerprint(data, deviceId)
  }, [data, deviceId])

  useEffect(() => {
    if (!fingerprint) return

    if (
      displayedFingerprint.current &&
      displayedFingerprint.current !== fingerprint
    ) {
      void clearDisplayedNotifications()
    }

    displayedFingerprint.current = fingerprint
  }, [fingerprint])

  useEffect(() => {
    if (
      permission !== NOTIFICATION_PERMISSION.GRANTED ||
      !preferenceReady ||
      !notificationsEnabled ||
      !data ||
      !fingerprint ||
      !navigator.onLine
    ) {
      syncQueue.clear()
      syncedFingerprint.current = ''
      return
    }

    if (isManualSyncing.current) return

    if (!syncQueue.isRunning() && syncedFingerprint.current === fingerprint) return

    if (retryFingerprint.current && retryFingerprint.current !== fingerprint) {
      window.clearTimeout(retryTimer.current)
      retryTimer.current = null
      retryFingerprint.current = ''
      retryAttempts.current = 0
    }

    const nextSync = { fingerprint }

    syncQueue.enqueue(async () => {
      if (syncedFingerprint.current === nextSync.fingerprint) return
      if (isMounted.current) setError('')

      const result = await uploadLatestSchedule()
      if (!result.acknowledged && isMounted.current) {
        setRetryRevision((revision) => revision + 1)
      }

      if (
        result.acknowledged &&
        retryFingerprint.current === result.snapshotFingerprint
      ) {
        window.clearTimeout(retryTimer.current)
        retryTimer.current = null
        retryFingerprint.current = ''
        retryAttempts.current = 0
      }
    }, {
      onError(cause) {
        if (isMounted.current) {
          setError(cause?.message || '알림 설정을 서버에 저장하지 못했어요.')
        }

        const status = Number(cause?.status ?? 0)
        const isRetryable = status === 0 || status === 408 || status === 429 || status >= 500

        if (
          isRetryable &&
          !syncQueue.hasPending() &&
          navigator.onLine &&
          isMounted.current
        ) {
          if (retryFingerprint.current !== nextSync.fingerprint) {
            retryFingerprint.current = nextSync.fingerprint
            retryAttempts.current = 0
          }

          const defaultDelay = getRetryDelay(retryAttempts.current)
          const retryAfterMs = Number(cause?.retryAfterMs)
          const delay = Math.max(
            defaultDelay,
            Number.isFinite(retryAfterMs) ? retryAfterMs : 0,
          )

          retryAttempts.current += 1
          window.clearTimeout(retryTimer.current)
          retryTimer.current = window.setTimeout(() => {
            retryTimer.current = null
            if (isMounted.current) {
              setRetryRevision((revision) => revision + 1)
            }
          }, delay)
        }
      },
    })
  }, [
    data,
    deviceId,
    fingerprint,
    retryRevision,
    permission,
    notificationsEnabled,
    preferenceReady,
    syncQueue,
    uploadLatestSchedule,
  ])

  async function stopAndWait() {
    window.clearTimeout(retryTimer.current)
    retryTimer.current = null
    retryFingerprint.current = ''
    retryAttempts.current = 0
    await syncQueue.clearAndWait()
  }

  async function syncNotificationTimes() {
    if (!preferenceReady) {
      throw new Error('알림 사용 설정을 확인하고 있어요. 잠시 후 다시 시도해주세요.')
    }
    if (!notificationsEnabled) return
    if (permission !== NOTIFICATION_PERMISSION.GRANTED) {
      throw new Error('브라우저 알림 권한을 확인해주세요.')
    }
    if (!data || !deviceId) {
      throw new Error('알림 정보를 준비하고 있어요. 잠시 후 다시 시도해주세요.')
    }
    if (!navigator.onLine) {
      throw new Error('인터넷 연결 후 알림 시간을 다시 저장해주세요.')
    }

    isManualSyncing.current = true
    setError('')

    try {
      await syncQueue.clearAndWait()
      setIsSyncing(true)
      const result = await uploadLatestSchedule()
      if (!result.acknowledged) {
        setRetryRevision((revision) => revision + 1)
      }
    } catch (cause) {
      setError(cause?.message || '알림 설정을 서버에 저장하지 못했어요.')
      setRetryRevision((revision) => revision + 1)
      throw cause
    } finally {
      isManualSyncing.current = false
      setIsSyncing(false)
    }
  }

  return { isSyncing, error, stopAndWait, syncNotificationTimes }
}
