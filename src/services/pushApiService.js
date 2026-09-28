import { API_BASE_URL } from '../config/api'

const REQUEST_TIMEOUT_MS = 10_000
let vapidPublicKeyPromise = null

async function request(path, options = {}) {
  let response
  let result = null
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })

    try {
      result = await response.json()
    } catch (cause) {
      if (controller.signal.aborted) throw cause
    }
  } catch (cause) {
    if (cause?.name === 'AbortError') {
      throw new Error(
        '알림 서버의 응답이 늦어지고 있어요. 잠시 후 다시 시도해주세요.',
        { cause },
      )
    }

    throw new Error(
      '알림 서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.',
      { cause },
    )
  } finally {
    window.clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const error = new Error(result?.error || '알림 서버 요청을 처리하지 못했어요.')
    error.status = response.status
    const retryAfterSeconds = Number(response.headers.get('retry-after'))

    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      error.retryAfterMs = retryAfterSeconds * 1_000
    }

    throw error
  }

  return result
}

export function getVapidPublicKey() {
  if (!vapidPublicKeyPromise) {
    vapidPublicKeyPromise = request('/api/vapid-public-key', { method: 'GET' })
      .then((result) => {
        if (!result?.publicKey) {
          throw new Error('알림 서버의 공개키를 불러오지 못했어요.')
        }

        return result.publicKey
      })
      .catch((error) => {
        vapidPublicKeyPromise = null
        throw error
      })
  }

  return vapidPublicKeyPromise
}

export function savePushSubscription(deviceId, subscription) {
  return request('/api/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ deviceId, subscription }),
  })
}

export function replaceNotificationJobs(deviceId, jobs) {
  return request('/api/jobs', {
    method: 'PUT',
    body: JSON.stringify({ deviceId, jobs }),
  })
}

export function syncNotificationState(deviceId, subscription, jobs) {
  return request('/api/notification-state', {
    method: 'PUT',
    body: JSON.stringify({ deviceId, subscription, jobs }),
  })
}

export function disablePushNotifications(deviceId) {
  return request('/api/notifications', {
    method: 'DELETE',
    body: JSON.stringify({ deviceId }),
  })
}
