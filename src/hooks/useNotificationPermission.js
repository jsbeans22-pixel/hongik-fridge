import { useEffect, useRef, useState } from 'react'
import { getOrCreateDeviceId } from '../db/deviceIdentityRepository'
import {
  getPushNotificationPreference,
  setPushNotificationPreference,
} from '../db/pushNotificationPreferenceRepository'
import { disablePushNotifications } from '../services/pushApiService'
import { clearDisplayedNotifications } from '../services/notificationDisplayService'
import { unsubscribeFromPushNotifications } from '../services/pushSubscriptionService'
import { clearNotificationSyncState } from '../db/notificationDeliveryStateRepository'
import {
  getNotificationPermission,
  NOTIFICATION_PERMISSION,
  requestNotificationPermission,
} from '../services/notificationPermissionService'

export function useNotificationPermission() {
  const [permission, setPermission] = useState(getNotificationPermission)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [preferenceReady, setPreferenceReady] = useState(false)
  const [disablePending, setDisablePending] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [pendingAction, setPendingAction] = useState('')
  const [error, setError] = useState('')
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    getPushNotificationPreference()
      .then(async (preference) => {
        const enabled = preference.enabled ?? (
          getNotificationPermission() === NOTIFICATION_PERMISSION.GRANTED
        )

        if (preference.enabled === null) {
          await setPushNotificationPreference({
            enabled,
            disablePending: false,
          })
        }

        if (!isMounted.current) return
        setNotificationsEnabled(enabled)
        setDisablePending(preference.disablePending)
        setPreferenceReady(true)
      })
      .catch(() => {
        if (!isMounted.current) return
        setError('알림 사용 설정을 불러오지 못했어요.')
        setPreferenceReady(true)
      })

    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    function refreshPermission() {
      setPermission(getNotificationPermission())
    }

    window.addEventListener('focus', refreshPermission)
    document.addEventListener('visibilitychange', refreshPermission)

    return () => {
      window.removeEventListener('focus', refreshPermission)
      document.removeEventListener('visibilitychange', refreshPermission)
    }
  }, [])

  async function enableNotifications() {
    if (isPending) return

    setIsPending(true)
    setPendingAction('enable')
    setError('')

    try {
      const currentPermission = getNotificationPermission()
      const nextPermission = currentPermission === NOTIFICATION_PERMISSION.GRANTED
        ? currentPermission
        : await requestNotificationPermission()
      setPermission(nextPermission)

      if (nextPermission === NOTIFICATION_PERMISSION.GRANTED) {
        await setPushNotificationPreference({
          enabled: true,
          disablePending: false,
        })
        setNotificationsEnabled(true)
        setDisablePending(false)
      }
    } catch (cause) {
      setError(cause?.message || '알림 권한을 요청하지 못했어요.')
      setPermission(getNotificationPermission())
    } finally {
      setIsPending(false)
      setPendingAction('')
    }
  }

  async function disableNotifications(stopNotificationSync) {
    if (isPending) return

    setIsPending(true)
    setPendingAction('disable')
    setError('')
    setNotificationsEnabled(false)
    setDisablePending(true)

    try {
      await setPushNotificationPreference({
        enabled: false,
        disablePending: true,
      })
      await clearNotificationSyncState()
      await clearDisplayedNotifications()
      await stopNotificationSync?.()

      const deviceId = await getOrCreateDeviceId()
      const [serverResult, subscriptionResult] = await Promise.allSettled([
        disablePushNotifications(deviceId),
        unsubscribeFromPushNotifications(),
      ])

      if (serverResult.status === 'rejected') {
        if (subscriptionResult.status === 'rejected') {
          throw new Error('알림을 안전하게 해제하지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.')
        }

        throw new Error('이 기기의 알림은 해제했지만 서버 정리가 필요해요. 다시 눌러주세요.')
      }

      await setPushNotificationPreference({
        enabled: false,
        disablePending: false,
      })
      setDisablePending(false)
    } catch (cause) {
      setError(cause?.message || '알림을 해제하지 못했어요.')
    } finally {
      setIsPending(false)
      setPendingAction('')
    }
  }

  return {
    permission,
    notificationsEnabled,
    preferenceReady,
    disablePending,
    isPending,
    pendingAction,
    error,
    enableNotifications,
    disableNotifications,
  }
}
