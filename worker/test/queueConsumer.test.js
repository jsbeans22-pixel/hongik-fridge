import assert from 'node:assert/strict'
import test from 'node:test'
import { processNotificationQueue } from '../src/queueConsumer.js'

function createMessage(overrides = {}) {
  const calls = { ack: 0, retry: [] }
  return {
    calls,
    message: {
      attempts: 1,
      body: {
        deviceId: 'device-1',
        jobId: 'job-1',
        notificationVersion: 'version-1',
      },
      ack() { calls.ack += 1 },
      retry(options) { calls.retry.push(options) },
      ...overrides,
    },
  }
}

function createOperations(overrides = {}) {
  return {
    configureWebPush: () => {},
    getJobForDelivery: async () => ({
      deviceId: 'device-1',
      id: 'job-1',
      notificationVersion: 'version-1',
    }),
    deliverJob: async () => ({ status: 'sent' }),
    releaseJobForRetry: async () => {},
    ...overrides,
  }
}

test('acknowledges a successfully delivered queue message', async () => {
  const { message, calls } = createMessage()

  const result = await processNotificationQueue(
    { messages: [message] },
    { DB: {} },
    createOperations(),
  )

  assert.equal(calls.ack, 1)
  assert.deepEqual(calls.retry, [])
  assert.equal(result.sent, 1)
})

test('acknowledges stale or duplicate queue messages without sending', async () => {
  const { message, calls } = createMessage()
  let delivered = false

  const result = await processNotificationQueue(
    { messages: [message] },
    { DB: {} },
    createOperations({
      getJobForDelivery: async () => null,
      deliverJob: async () => { delivered = true },
    }),
  )

  assert.equal(delivered, false)
  assert.equal(calls.ack, 1)
  assert.equal(result.skipped, 1)
})

test('retries only a temporarily failed queue message', async () => {
  const { message, calls } = createMessage({ attempts: 2 })

  const result = await processNotificationQueue(
    { messages: [message] },
    { DB: {} },
    createOperations({
      deliverJob: async () => ({ status: 'retry' }),
    }),
  )

  assert.equal(calls.ack, 0)
  assert.deepEqual(calls.retry, [{ delaySeconds: 30 }])
  assert.equal(result.retry, 1)
})

test('releases a claimed job when an unexpected consumer error occurs', async () => {
  const { message, calls } = createMessage()
  const released = []

  const result = await processNotificationQueue(
    { messages: [message] },
    { DB: {} },
    createOperations({
      deliverJob: async () => { throw new Error('unexpected') },
      releaseJobForRetry: async (
        _db,
        deviceId,
        id,
        notificationVersion,
        _now,
        error,
      ) => {
        released.push({ deviceId, id, notificationVersion, error })
      },
    }),
  )

  assert.deepEqual(released, [{
    deviceId: 'device-1',
    id: 'job-1',
    notificationVersion: 'version-1',
    error: 'unexpected',
  }])
  assert.deepEqual(calls.retry, [{ delaySeconds: 15 }])
  assert.equal(result.retry, 1)
})
