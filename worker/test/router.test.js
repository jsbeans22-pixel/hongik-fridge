import assert from 'node:assert/strict'
import test from 'node:test'
import { route } from '../src/router.js'

const env = {
  ALLOWED_ORIGINS: 'http://localhost:5173',
  VAPID_PUBLIC_KEY: 'public-vapid-key',
}

test('returns a health response without a database query', async () => {
  const response = await route(new Request('https://api.example.com/health'), env)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    ok: true,
    service: 'hongik-fridge-api',
  })
})

test('returns the public VAPID key to an allowed origin', async () => {
  const response = await route(new Request('https://api.example.com/api/vapid-public-key', {
    headers: { origin: 'http://localhost:5173' },
  }), env)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  assert.deepEqual(await response.json(), { ok: true, publicKey: 'public-vapid-key' })
})

test('reports unhealthy notification delivery when dead letters exist', async () => {
  const database = {
    prepare(sql) {
      return { bind(...bindings) { return { sql, bindings } } }
    },
    async batch() {
      return [
        { results: [{ count: 1, lastFailureAt: 900 }] },
        { results: [{ count: 0 }] },
        { results: [{ count: 0, oldestScheduledAt: null }] },
      ]
    },
  }

  const response = await route(
    new Request('https://api.example.com/api/notification-health'),
    { ...env, DB: database },
  )

  assert.equal(response.status, 503)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), {
    ok: false,
    deadLetters24h: 1,
    lastDeadLetterAt: 900,
    failedJobs24h: 0,
    overdueJobs: 0,
    oldestOverdueAt: null,
  })
})

test('blocks browser requests from an unknown origin', async () => {
  const response = await route(new Request('https://api.example.com/health', {
    headers: { origin: 'https://unknown.example.com' },
  }), env)
  assert.equal(response.status, 403)
})

test('rate limits mutation requests before reading their body', async () => {
  const response = await route(new Request('https://api.example.com/api/jobs', {
    method: 'PUT',
    headers: {
      origin: 'http://localhost:5173',
      'cf-connecting-ip': '203.0.113.10',
    },
  }), {
    ...env,
    IP_RATE_LIMITER: {
      limit: async ({ key }) => {
        assert.equal(key, 'ip:203.0.113.10')
        return { success: false }
      },
    },
  })

  assert.equal(response.status, 429)
  assert.equal(response.headers.get('retry-after'), '60')
  assert.deepEqual(await response.json(), {
    ok: false,
    error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
  })
})

test('disables all notifications for a device in one request', async () => {
  const database = {
    statements: [],
    prepare(sql) {
      return {
        bind(...bindings) {
          return { sql, bindings }
        },
      }
    },
    async batch(statements) {
      database.statements = statements
    },
  }
  const allow = { limit: async () => ({ success: true }) }

  const response = await route(new Request('https://api.example.com/api/notifications', {
    method: 'DELETE',
    headers: {
      origin: 'http://localhost:5173',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      deviceId: '123e4567-e89b-42d3-a456-426614174000',
    }),
  }), {
    ...env,
    DB: database,
    IP_RATE_LIMITER: allow,
    DEVICE_RATE_LIMITER: allow,
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(database.statements.length, 3)
  assert.match(database.statements[0].sql, /notifications_enabled = 0/)
})

test('saves a subscription and jobs through one notification state request', async () => {
  const database = {
    statements: [],
    prepare(sql) {
      return {
        bind(...bindings) {
          return { sql, bindings }
        },
      }
    },
    async batch(statements) {
      database.statements = statements
    },
  }
  const allow = { limit: async () => ({ success: true }) }
  const now = Date.now()

  const response = await route(new Request('https://api.example.com/api/notification-state', {
    method: 'PUT',
    headers: {
      origin: 'http://localhost:5173',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      deviceId: '123e4567-e89b-42d3-a456-426614174000',
      subscription: {
        endpoint: 'https://push.example.com/current',
        expirationTime: null,
        keys: { p256dh: 'public-key', auth: 'auth-secret' },
      },
      jobs: [{
        id: 'job-1',
        foodId: 'food-1',
        notificationId: 'notification-1',
        scheduledAt: now + 60_000,
        title: '보관 기한 알림',
        body: '냉장고를 확인해 주세요.',
        url: '/',
      }],
    }),
  }), {
    ...env,
    DB: database,
    IP_RATE_LIMITER: allow,
    DEVICE_RATE_LIMITER: allow,
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true, savedCount: 1 })
  assert.equal(database.statements.length, 5)
})
