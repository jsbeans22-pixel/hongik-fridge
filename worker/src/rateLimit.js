import { HttpError } from './http.js'

const RETRY_AFTER_SECONDS = 60

function requireRateLimiter(value, bindingName) {
  if (!value || typeof value.limit !== 'function') {
    throw new Error(`${bindingName} Rate Limiting 바인딩이 없습니다.`)
  }

  return value
}

async function enforceRateLimit(limiter, key, scope, pathname) {
  const { success } = await limiter.limit({ key })
  if (success) return

  console.warn(JSON.stringify({
    event: 'rate_limited',
    scope,
    pathname,
  }))

  throw new HttpError(
    429,
    '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
    { 'retry-after': String(RETRY_AFTER_SECONDS) },
  )
}

export function enforceClientRateLimit(request, env, pathname) {
  const limiter = requireRateLimiter(env.IP_RATE_LIMITER, 'IP_RATE_LIMITER')
  const clientIp = request.headers.get('cf-connecting-ip') || 'local-development'

  return enforceRateLimit(limiter, `ip:${clientIp}`, 'client', pathname)
}

export function enforceDeviceRateLimit(env, deviceId, pathname) {
  const limiter = requireRateLimiter(env.DEVICE_RATE_LIMITER, 'DEVICE_RATE_LIMITER')

  return enforceRateLimit(limiter, `device:${deviceId}`, 'device', pathname)
}
