import {
  CLAIM_TIMEOUT_MS,
  MAX_DELIVERY_ATTEMPTS,
  QUEUE_DISPATCH_BATCH_SIZE,
  QUEUE_REDISPATCH_TIMEOUT_MS,
  QUEUE_SEND_BATCH_SIZE,
} from './constants.js'
import {
  deleteOldJobs,
  getDueJobs,
  markJobsDispatched,
  recoverStaleClaims,
} from './repository.js'

const HISTORY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

const DEFAULT_OPERATIONS = {
  deleteOldJobs,
  getDueJobs,
  markJobsDispatched,
  recoverStaleClaims,
}

function toQueueMessage(job) {
  return {
    body: {
      deviceId: job.deviceId,
      jobId: job.id,
      notificationVersion: job.notificationVersion,
    },
    contentType: 'json',
  }
}

export async function dispatchDueNotifications(
  env,
  scheduledTime = Date.now(),
  operations = DEFAULT_OPERATIONS,
) {
  if (!env.NOTIFICATION_QUEUE?.sendBatch) {
    throw new Error('NOTIFICATION_QUEUE 바인딩이 없습니다.')
  }

  await operations.recoverStaleClaims(
    env.DB,
    scheduledTime,
    CLAIM_TIMEOUT_MS,
    MAX_DELIVERY_ATTEMPTS,
  )

  const jobs = await operations.getDueJobs(
    env.DB,
    scheduledTime,
    QUEUE_DISPATCH_BATCH_SIZE,
    scheduledTime - QUEUE_REDISPATCH_TIMEOUT_MS,
  )

  let enqueued = 0
  for (let index = 0; index < jobs.length; index += QUEUE_SEND_BATCH_SIZE) {
    const chunk = jobs.slice(index, index + QUEUE_SEND_BATCH_SIZE)
    await env.NOTIFICATION_QUEUE.sendBatch(chunk.map(toQueueMessage))
    await operations.markJobsDispatched(env.DB, chunk, scheduledTime)
    enqueued += chunk.length
  }

  await operations.deleteOldJobs(
    env.DB,
    scheduledTime - HISTORY_RETENTION_MS,
  )

  const oldestDelayMs = jobs.length > 0
    ? Math.max(0, scheduledTime - Number(jobs[0].scheduledAt))
    : 0
  const summary = { due: jobs.length, enqueued, oldestDelayMs }
  console.log(JSON.stringify({ event: 'notification_dispatch', ...summary }))
  return summary
}
