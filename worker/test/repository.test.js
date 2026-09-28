import assert from 'node:assert/strict'
import test from 'node:test'
import {
  disableNotifications,
  claimJob,
  getNotificationHealth,
  markJobFailed,
  markJobSent,
  markJobsDispatched,
  releaseJobForRetry,
  recordDeadLetters,
  replaceJobs,
  saveSubscription,
  syncNotificationState,
} from '../src/repository.js'

function createFakeDatabase() {
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
  return database
}

function createWriteCaptureDatabase() {
  const calls = []
  return {
    calls,
    prepare(sql) {
      return {
        bind(...bindings) {
          return {
            async run() {
              calls.push({ sql, bindings })
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  }
}

test('keeps only the latest push subscription for one device', async () => {
  const database = createFakeDatabase()
  const deviceId = '123e4567-e89b-42d3-a456-426614174000'
  const subscription = {
    endpoint: 'https://push.example.com/current',
    expirationTime: null,
    keys: { p256dh: 'public-key', auth: 'auth-secret' },
  }

  await saveSubscription(database, deviceId, subscription, Date.now())

  assert.equal(database.statements.length, 3)
  assert.match(database.statements[1].sql, /DELETE FROM push_subscriptions/)
  assert.deepEqual(database.statements[1].bindings, [
    deviceId,
    subscription.endpoint,
  ])
  assert.match(database.statements[2].sql, /INSERT INTO push_subscriptions/)
})

test('batches 300 jobs within the free D1 per-invocation query limit', async () => {
  const database = createFakeDatabase()
  const now = Date.now()
  const jobs = Array.from({ length: 300 }, (_, index) => ({
    id: `job-${index}`,
    foodId: `food-${index}`,
    notificationId: `notification-${index}`,
    scheduledAt: now + 60_000,
    title: '보관 기한 알림',
    body: '냉장고를 확인해 주세요.',
    url: '/',
  }))

  const savedCount = await replaceJobs(
    database,
    '123e4567-e89b-42d3-a456-426614174000',
    jobs,
    now,
  )

  assert.equal(savedCount, 300)
  assert.equal(database.statements.length, 36)
  assert.ok(database.statements.every(({ bindings }) => bindings.length <= 100))
  assert.match(database.statements[0].sql, /notification_version = excluded\.notification_version/)
  assert.match(database.statements[1].sql, /DELETE FROM notification_jobs/)

  const notificationVersion = database.statements[0].bindings.at(-1)
  const insertedVersions = database.statements
    .slice(2)
    .flatMap(({ bindings }) => bindings.filter((_, index) => index % 11 === 8))
  assert.equal(insertedVersions.length, 300)
  assert.ok(insertedVersions.every((version) => version === notificationVersion))
})

test('saves the subscription and notification jobs in one database batch', async () => {
  const database = createFakeDatabase()
  const now = Date.now()
  const deviceId = '123e4567-e89b-42d3-a456-426614174000'
  const subscription = {
    endpoint: 'https://push.example.com/current',
    expirationTime: null,
    keys: { p256dh: 'public-key', auth: 'auth-secret' },
  }
  const jobs = [{
    id: 'job-1',
    foodId: 'food-1',
    notificationId: 'notification-1',
    scheduledAt: now + 60_000,
    title: '보관 기한 알림',
    body: '냉장고를 확인해 주세요.',
    url: '/',
  }]

  const savedCount = await syncNotificationState(
    database,
    deviceId,
    subscription,
    jobs,
    now,
  )

  assert.equal(savedCount, 1)
  assert.equal(database.statements.length, 5)
  assert.match(database.statements[0].sql, /notifications_enabled = 1/)
  assert.match(database.statements[1].sql, /DELETE FROM push_subscriptions/)
  assert.match(database.statements[2].sql, /INSERT INTO push_subscriptions/)
  assert.match(database.statements[3].sql, /DELETE FROM notification_jobs/)
  assert.match(database.statements[4].sql, /INSERT INTO notification_jobs/)

  const notificationVersion = database.statements[0].bindings.at(-1)
  assert.equal(database.statements[4].bindings[8], notificationVersion)
})

test('disables a device and removes every job and subscription in one batch', async () => {
  const database = createFakeDatabase()

  await disableNotifications(
    database,
    '123e4567-e89b-42d3-a456-426614174000',
    Date.now(),
  )

  assert.equal(database.statements.length, 3)
  assert.match(database.statements[0].sql, /notifications_enabled = 0/)
  assert.match(database.statements[1].sql, /DELETE FROM notification_jobs/)
  assert.match(database.statements[2].sql, /DELETE FROM push_subscriptions/)
})

test('marks dispatched jobs in statements below the D1 binding limit', async () => {
  const database = createFakeDatabase()
  const jobs = Array.from({ length: 100 }, (_, index) => ({
    deviceId: `device-${index}`,
    id: `job-${index}`,
    notificationVersion: `version-${index}`,
  }))

  await markJobsDispatched(database, jobs, Date.now())

  assert.equal(database.statements.length, 4)
  assert.ok(database.statements.every(({ bindings }) => bindings.length <= 100))
  assert.ok(database.statements.every(({ sql }) => /dispatched_at/.test(sql)))
})

test('guards every delivery state write with the notification version', async () => {
  const database = createWriteCaptureDatabase()
  const deviceId = '123e4567-e89b-42d3-a456-426614174000'
  const jobId = 'job-1'
  const notificationVersion = 'version-1'
  const now = Date.now()

  await claimJob(database, deviceId, jobId, notificationVersion, now)
  await markJobSent(database, deviceId, jobId, notificationVersion, now)
  await markJobFailed(
    database,
    deviceId,
    jobId,
    notificationVersion,
    now,
    'temporary failure',
    true,
  )
  await releaseJobForRetry(
    database,
    deviceId,
    jobId,
    notificationVersion,
    now,
    'consumer failure',
  )

  assert.equal(database.calls.length, 4)
  for (const { sql, bindings } of database.calls) {
    assert.match(sql, /notification_version = \?/)
    assert.ok(bindings.includes(notificationVersion))
  }
  assert.match(database.calls[1].sql, /status = 'processing'/)
  assert.match(database.calls[2].sql, /status = 'processing'/)
  assert.match(database.calls[3].sql, /status = 'processing'/)
})

test('stores dead letters idempotently in one database batch', async () => {
  const database = createFakeDatabase()
  await recordDeadLetters(database, [{
    id: 'dead-letter-1',
    queueMessageId: 'queue-message-1',
    deviceId: 'device-1',
    jobId: 'job-1',
    notificationVersion: 'version-1',
    attempts: 4,
    failedAt: 1_000,
    payload: '{}',
  }])

  assert.equal(database.statements.length, 1)
  assert.match(database.statements[0].sql, /INSERT OR IGNORE/)
  assert.deepEqual(database.statements[0].bindings.slice(1), [
    'queue-message-1',
    'device-1',
    'job-1',
    'version-1',
    4,
    1_000,
    '{}',
  ])
})

test('summarizes recent delivery failures without returning device data', async () => {
  const database = {
    prepare(sql) {
      return { bind(...bindings) { return { sql, bindings } } }
    },
    async batch() {
      return [
        { results: [{ count: 2, lastFailureAt: 900 }] },
        { results: [{ count: 3 }] },
        { results: [{ count: 1, oldestScheduledAt: 500 }] },
      ]
    },
  }

  assert.deepEqual(await getNotificationHealth(database, 1_000), {
    deadLetters24h: 2,
    lastDeadLetterAt: 900,
    failedJobs24h: 3,
    overdueJobs: 1,
    oldestOverdueAt: 500,
  })
})
