import assert from 'node:assert/strict'
import test from 'node:test'
import { deliverJob } from '../src/scheduler.js'

const NOW = Date.parse('2026-01-08T12:00:00Z')
const SUBSCRIPTION = {
  endpoint: 'https://push.example.com/subscription/123',
  expirationTime: null,
  keys: { p256dh: 'public-key', auth: 'auth-secret' },
}

function createJob(attempts = 0) {
  return {
    deviceId: '123e4567-e89b-42d3-a456-426614174000',
    id: 'food-1:notification-1',
    foodId: 'food-1',
    notificationId: 'notification-1',
    scheduledAt: NOW,
    title: '보관 기한을 확인해 주세요',
    body: '🥛 우유의 보관 기한이 오늘까지예요.',
    url: '/',
    notificationVersion: 'version-1',
    attempts,
  }
}

function createDeliveryHarness({
  subscriptions = [SUBSCRIPTION],
  sendPush = async () => {},
} = {}) {
  const calls = {
    claimed: [],
    failed: [],
    removedEndpoints: [],
    sent: [],
  }

  return {
    calls,
    operations: {
      claimJob: async (_db, deviceId, id, notificationVersion, now) => {
        calls.claimed.push({ deviceId, id, notificationVersion, now })
        return true
      },
      getSubscriptions: async () => subscriptions,
      isJobDeliverable: async () => true,
      sendPush,
      removeSubscriptionByEndpoint: async (_db, endpoint) => {
        calls.removedEndpoints.push(endpoint)
      },
      markJobSent: async (_db, deviceId, id, notificationVersion, now) => {
        calls.sent.push({ deviceId, id, notificationVersion, now })
      },
      markJobFailed: async (
        _db,
        deviceId,
        id,
        notificationVersion,
        now,
        message,
        shouldRetry,
      ) => {
        calls.failed.push({
          deviceId,
          id,
          notificationVersion,
          now,
          message,
          shouldRetry,
        })
      },
    },
  }
}

test('skips a claimed notification after the device is disabled or changed', async () => {
  let pushCalled = false
  const harness = createDeliveryHarness({
    sendPush: async () => {
      pushCalled = true
    },
  })
  harness.operations.isJobDeliverable = async () => false

  const result = await deliverJob(
    { DB: {} },
    createJob(),
    NOW,
    harness.operations,
  )

  assert.deepEqual(result, { status: 'skipped' })
  assert.equal(pushCalled, false)
  assert.deepEqual(harness.calls.sent, [])
})

test('marks a successfully delivered notification as sent', async () => {
  const harness = createDeliveryHarness()
  const job = createJob()

  const result = await deliverJob({ DB: {} }, job, NOW, harness.operations)

  assert.deepEqual(result, { status: 'sent' })
  assert.equal(harness.calls.claimed[0].notificationVersion, 'version-1')
  assert.equal(harness.calls.sent.length, 1)
  assert.equal(harness.calls.sent[0].notificationVersion, 'version-1')
  assert.deepEqual(harness.calls.failed, [])
  assert.deepEqual(harness.calls.removedEndpoints, [])
})

for (const statusCode of [404, 410]) {
  test(`removes an expired push subscription after push ${statusCode}`, async () => {
    const harness = createDeliveryHarness({
      sendPush: async () => {
        throw { statusCode }
      },
    })

    const result = await deliverJob(
      { DB: {} },
      createJob(),
      NOW,
      harness.operations,
    )

    assert.deepEqual(result, { status: 'failed' })
    assert.deepEqual(
      harness.calls.removedEndpoints,
      [SUBSCRIPTION.endpoint],
    )
    assert.equal(harness.calls.failed[0].shouldRetry, false)
  })
}

for (const statusCode of [429, 500, 503]) {
  test(`retries a temporary push ${statusCode} failure`, async () => {
    const harness = createDeliveryHarness({
      sendPush: async () => {
        throw { statusCode }
      },
    })

    const result = await deliverJob(
      { DB: {} },
      createJob(),
      NOW,
      harness.operations,
    )

    assert.deepEqual(result, { status: 'retry' })
    assert.equal(harness.calls.failed[0].shouldRetry, true)
    assert.equal(harness.calls.failed[0].notificationVersion, 'version-1')
    assert.equal(harness.calls.failed[0].message, `push ${statusCode}`)
  })
}

test('stops retrying after the maximum delivery attempt', async () => {
  const harness = createDeliveryHarness({
    sendPush: async () => {
      throw { statusCode: 503 }
    },
  })

  const result = await deliverJob(
    { DB: {} },
    createJob(2),
    NOW,
    harness.operations,
  )

  assert.deepEqual(result, { status: 'failed' })
  assert.equal(harness.calls.failed[0].shouldRetry, false)
})

test('fails without retry when the device has no subscriptions', async () => {
  const harness = createDeliveryHarness({ subscriptions: [] })

  const result = await deliverJob(
    { DB: {} },
    createJob(),
    NOW,
    harness.operations,
  )

  assert.deepEqual(result, { status: 'failed' })
  assert.equal(harness.calls.failed[0].shouldRetry, false)
  assert.equal(
    harness.calls.failed[0].message,
    '등록된 푸시 구독이 없습니다.',
  )
})
