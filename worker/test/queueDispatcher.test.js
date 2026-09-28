import assert from 'node:assert/strict'
import test from 'node:test'
import { dispatchDueNotifications } from '../src/queueDispatcher.js'

const NOW = Date.parse('2026-01-08T13:00:00Z')

function createJob(index) {
  return {
    deviceId: `device-${index}`,
    id: `job-${index}`,
    notificationVersion: `version-${index}`,
    scheduledAt: NOW - 60_000,
  }
}

test('dispatches due jobs to the queue in batches of at most 100', async () => {
  const jobs = Array.from({ length: 205 }, (_, index) => createJob(index))
  const sentBatches = []
  const markedChunks = []
  const operations = {
    recoverStaleClaims: async () => {},
    getDueJobs: async () => jobs,
    markJobsDispatched: async (_db, chunk) => markedChunks.push(chunk),
    deleteOldJobs: async () => {},
  }
  const env = {
    DB: {},
    NOTIFICATION_QUEUE: {
      sendBatch: async (messages) => sentBatches.push(messages),
    },
  }

  const result = await dispatchDueNotifications(env, NOW, operations)

  assert.deepEqual(sentBatches.map(({ length }) => length), [100, 100, 5])
  assert.deepEqual(markedChunks.map(({ length }) => length), [100, 100, 5])
  assert.deepEqual(sentBatches[0][0], {
    body: {
      deviceId: 'device-0',
      jobId: 'job-0',
      notificationVersion: 'version-0',
    },
    contentType: 'json',
  })
  assert.deepEqual(result, {
    due: 205,
    enqueued: 205,
    oldestDelayMs: 60_000,
  })
})

test('does not mark a chunk dispatched when queue persistence fails', async () => {
  let marked = false
  const operations = {
    recoverStaleClaims: async () => {},
    getDueJobs: async () => [createJob(0)],
    markJobsDispatched: async () => { marked = true },
    deleteOldJobs: async () => {},
  }
  const env = {
    DB: {},
    NOTIFICATION_QUEUE: {
      sendBatch: async () => { throw new Error('queue unavailable') },
    },
  }

  await assert.rejects(
    dispatchDueNotifications(env, NOW, operations),
    /queue unavailable/,
  )
  assert.equal(marked, false)
})
