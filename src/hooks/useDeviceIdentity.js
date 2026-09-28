import { useEffect, useState } from 'react'
import { getOrCreateDeviceId } from '../db/deviceIdentityRepository'

export function useDeviceIdentity() {
  const [deviceId, setDeviceId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    getOrCreateDeviceId()
      .then((storedDeviceId) => {
        if (isActive) setDeviceId(storedDeviceId)
      })
      .catch(() => {
        if (isActive) setError('기기 정보를 저장하지 못했어요.')
      })

    return () => {
      isActive = false
    }
  }, [])

  return { deviceId, error, isLoading: !deviceId && !error }
}
