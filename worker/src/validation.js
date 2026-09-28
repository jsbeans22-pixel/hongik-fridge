import {
  MAX_JOB_AGE_MS,
  MAX_JOB_FUTURE_MS,
  MAX_JOBS_PER_DEVICE,
} from './constants.js'
import { HttpError } from './http.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const APP_ORIGIN = 'https://app.invalid'

function requiredString(value, name, maxLength) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new HttpError(400, `${name} 값이 올바르지 않습니다.`)
  }
  return value
}

export function validateDeviceId(value) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new HttpError(400, 'deviceId 값이 올바르지 않습니다.')
  }
  return value
}

export function validateEndpoint(value) {
  const endpoint = requiredString(value, 'endpoint', 2048)
  let endpointUrl
  try {
    endpointUrl = new URL(endpoint)
  } catch {
    throw new HttpError(400, 'endpoint 주소가 올바르지 않습니다.')
  }
  if (endpointUrl.protocol !== 'https:') {
    throw new HttpError(400, 'endpoint는 HTTPS 주소여야 합니다.')
  }

  return endpoint
}

export function validateSubscription(value) {
  if (!value || typeof value !== 'object') {
    throw new HttpError(400, '푸시 구독 정보가 필요합니다.')
  }

  const endpoint = validateEndpoint(value.endpoint)

  const expirationTime = value.expirationTime == null
    ? null
    : Number(value.expirationTime)
  if (expirationTime !== null && !Number.isFinite(expirationTime)) {
    throw new HttpError(400, 'expirationTime 값이 올바르지 않습니다.')
  }

  return {
    endpoint,
    expirationTime,
    keys: {
      p256dh: requiredString(value.keys?.p256dh, 'p256dh', 512),
      auth: requiredString(value.keys?.auth, 'auth', 256),
    },
  }
}

export function validateInternalUrl(value) {
  const url = requiredString(value ?? '/', 'url', 512)
  let parsedUrl

  try {
    parsedUrl = new URL(url, APP_ORIGIN)
  } catch {
    throw new HttpError(400, '알림 이동 주소는 앱 내부 경로여야 합니다.')
  }

  if (!url.startsWith('/') || parsedUrl.origin !== APP_ORIGIN) {
    throw new HttpError(400, '알림 이동 주소는 앱 내부 경로여야 합니다.')
  }

  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
}

function validateJob(value, now) {
  if (!value || typeof value !== 'object') {
    throw new HttpError(400, '알림 일정 형식이 올바르지 않습니다.')
  }

  const scheduledAt = Number(value.scheduledAt)
  if (
    !Number.isInteger(scheduledAt) ||
    scheduledAt < now - MAX_JOB_AGE_MS ||
    scheduledAt > now + MAX_JOB_FUTURE_MS
  ) {
    throw new HttpError(400, '알림 발송 시간이 허용 범위를 벗어났습니다.')
  }

  const url = validateInternalUrl(value.url)

  return {
    id: requiredString(value.id, '알림 일정 ID', 160),
    foodId: requiredString(value.foodId, '음식 ID', 100),
    notificationId: requiredString(value.notificationId, '알림 ID', 100),
    scheduledAt,
    title: requiredString(value.title, '알림 제목', 80),
    body: requiredString(value.body, '알림 내용', 240),
    url,
  }
}

export function validateJobs(value, now = Date.now()) {
  if (!Array.isArray(value) || value.length > MAX_JOBS_PER_DEVICE) {
    throw new HttpError(400, `알림 일정은 최대 ${MAX_JOBS_PER_DEVICE}개까지 저장할 수 있습니다.`)
  }

  const jobs = value.map((job) => validateJob(job, now))
  if (new Set(jobs.map(({ id }) => id)).size !== jobs.length) {
    throw new HttpError(400, '중복된 알림 일정 ID가 있습니다.')
  }

  return jobs
}
