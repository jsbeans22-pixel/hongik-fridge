import {
  assertAllowedOrigin,
  getCorsHeaders,
  handleError,
  HttpError,
  json,
  readJson,
} from './http.js'
import {
  disableNotifications,
  getNotificationHealth,
  removeJobs,
  removeSubscription,
  replaceJobs,
  saveSubscription,
  syncNotificationState,
} from './repository.js'
import {
  enforceClientRateLimit,
  enforceDeviceRateLimit,
} from './rateLimit.js'
import {
  validateDeviceId,
  validateEndpoint,
  validateJobs,
  validateSubscription,
} from './validation.js'

function requireDatabase(env) {
  if (!env.DB) throw new Error('D1 DB 바인딩이 없습니다.')
}

function isRateLimitedRequest(method, pathname) {
  return (
    (method === 'POST' || method === 'DELETE') &&
    pathname === '/api/subscriptions'
  ) || (
    (method === 'PUT' || method === 'DELETE') &&
    pathname === '/api/jobs'
  ) || (
    method === 'PUT' &&
    pathname === '/api/notification-state'
  ) || (
    method === 'DELETE' &&
    pathname === '/api/notifications'
  )
}

export async function route(request, env) {
  const corsHeaders = getCorsHeaders(request, env)

  try {
    assertAllowedOrigin(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const { pathname } = new URL(request.url)

    if (isRateLimitedRequest(request.method, pathname)) {
      await enforceClientRateLimit(request, env, pathname)
    }

    if (request.method === 'GET' && pathname === '/health') {
      return json({ ok: true, service: 'hongik-fridge-api' }, { headers: corsHeaders })
    }

    if (request.method === 'GET' && pathname === '/api/vapid-public-key') {
      if (!env.VAPID_PUBLIC_KEY) throw new Error('VAPID 공개키가 설정되지 않았습니다.')
      return json({ ok: true, publicKey: env.VAPID_PUBLIC_KEY }, {
        headers: { ...corsHeaders, 'cache-control': 'public, max-age=3600' },
      })
    }

    if (request.method === 'GET' && pathname === '/api/notification-health') {
      requireDatabase(env)
      const health = await getNotificationHealth(env.DB, Date.now())
      const ok = health.deadLetters24h === 0 && health.overdueJobs === 0
      return json({ ok, ...health }, {
        status: ok ? 200 : 503,
        headers: { ...corsHeaders, 'cache-control': 'no-store' },
      })
    }

    if (request.method === 'PUT' && pathname === '/api/notification-state') {
      requireDatabase(env)
      const payload = await readJson(request)
      const deviceId = validateDeviceId(payload.deviceId)
      await enforceDeviceRateLimit(env, deviceId, pathname)
      const subscription = validateSubscription(payload.subscription)
      const now = Date.now()
      const jobs = validateJobs(payload.jobs, now)
      const savedCount = await syncNotificationState(
        env.DB,
        deviceId,
        subscription,
        jobs,
        now,
      )
      return json({ ok: true, savedCount }, { headers: corsHeaders })
    }

    if (request.method === 'POST' && pathname === '/api/subscriptions') {
      requireDatabase(env)
      const payload = await readJson(request)
      const deviceId = validateDeviceId(payload.deviceId)
      await enforceDeviceRateLimit(env, deviceId, pathname)
      const subscription = validateSubscription(payload.subscription)
      await saveSubscription(env.DB, deviceId, subscription, Date.now())
      return json({ ok: true }, { status: 201, headers: corsHeaders })
    }

    if (request.method === 'DELETE' && pathname === '/api/subscriptions') {
      requireDatabase(env)
      const payload = await readJson(request)
      const deviceId = validateDeviceId(payload.deviceId)
      await enforceDeviceRateLimit(env, deviceId, pathname)
      const endpoint = validateEndpoint(payload.endpoint)
      await removeSubscription(env.DB, deviceId, endpoint)
      return json({ ok: true }, { headers: corsHeaders })
    }

    if (request.method === 'PUT' && pathname === '/api/jobs') {
      requireDatabase(env)
      const payload = await readJson(request)
      const deviceId = validateDeviceId(payload.deviceId)
      await enforceDeviceRateLimit(env, deviceId, pathname)
      const now = Date.now()
      const jobs = validateJobs(payload.jobs, now)
      const savedCount = await replaceJobs(env.DB, deviceId, jobs, now)
      return json({ ok: true, savedCount }, { headers: corsHeaders })
    }

    if (request.method === 'DELETE' && pathname === '/api/jobs') {
      requireDatabase(env)
      const payload = await readJson(request)
      const deviceId = validateDeviceId(payload.deviceId)
      await enforceDeviceRateLimit(env, deviceId, pathname)
      await removeJobs(env.DB, deviceId)
      return json({ ok: true }, { headers: corsHeaders })
    }

    if (request.method === 'DELETE' && pathname === '/api/notifications') {
      requireDatabase(env)
      const payload = await readJson(request)
      const deviceId = validateDeviceId(payload.deviceId)
      await enforceDeviceRateLimit(env, deviceId, pathname)
      await disableNotifications(env.DB, deviceId, Date.now())
      return json({ ok: true }, { headers: corsHeaders })
    }

    throw new HttpError(404, '요청한 API를 찾을 수 없습니다.')
  } catch (error) {
    return handleError(error, corsHeaders)
  }
}
