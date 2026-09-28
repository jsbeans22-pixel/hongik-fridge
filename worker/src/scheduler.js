import {
  CLAIM_TIMEOUT_MS,
  DIRECT_DELIVERY_BATCH_SIZE,
  MAX_DELIVERY_ATTEMPTS,
} from './constants.js'
import { configureWebPush, getPushStatusCode, sendPush } from './push.js'
import {
  claimJob,
  deleteOldJobs,
  getDueJobs,
  getSubscriptions,
  isJobDeliverable,
  markJobFailed,
  markJobSent,
  recoverStaleClaims,
  removeSubscriptionByEndpoint,
} from './repository.js'

const HISTORY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

const DEFAULT_DELIVERY_OPERATIONS = {
  claimJob,
  getSubscriptions,
  isJobDeliverable,
  markJobFailed,
  markJobSent,
  removeSubscriptionByEndpoint,
  sendPush,
}

export async function deliverJob(
  env,
  job,
  now,
  operations = DEFAULT_DELIVERY_OPERATIONS,
) {
  const claimed = await operations.claimJob(
    env.DB,
    job.deviceId,
    job.id,
    job.notificationVersion,
    now,
  )
  if (!claimed) return { status: 'skipped' }

  const subscriptions = await operations.getSubscriptions(env.DB, job.deviceId)
  if (subscriptions.length === 0) {
    await operations.markJobFailed(
      env.DB,
      job.deviceId,
      job.id,
      job.notificationVersion,
      now,
      '등록된 푸시 구독이 없습니다.',
      false,
    )
    return { status: 'failed' }
  }

  const deliverable = await operations.isJobDeliverable(
    env.DB,
    job.deviceId,
    job.id,
    job.notificationVersion,
  )
  if (!deliverable) return { status: 'skipped' }

  const results = await Promise.allSettled(
    subscriptions.map((subscription) => operations.sendPush(subscription, job)),
  )

  let delivered = false
  let retryableFailure = false
  const errors = []

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]
    if (result.status === 'fulfilled') {
      delivered = true
      continue
    }

    const statusCode = getPushStatusCode(result.reason)
    if (statusCode === 404 || statusCode === 410) {
      await operations.removeSubscriptionByEndpoint(
        env.DB,
        subscriptions[index].endpoint,
      )
      continue
    }

    if (
      statusCode === 0 ||
      statusCode === 408 ||
      statusCode === 429 ||
      statusCode >= 500
    ) {
      retryableFailure = true
    }
    errors.push(statusCode ? `push ${statusCode}` : 'push error')
  }

  if (delivered) {
    await operations.markJobSent(
      env.DB,
      job.deviceId,
      job.id,
      job.notificationVersion,
      now,
    )
    return { status: 'sent' }
  }

  const nextAttempt = Number(job.attempts) + 1
  const shouldRetry = retryableFailure && nextAttempt < MAX_DELIVERY_ATTEMPTS
  await operations.markJobFailed(
    env.DB,
    job.deviceId,
    job.id,
    job.notificationVersion,
    now,
    errors.join(', ') || '사용 가능한 푸시 구독이 없습니다.',
    shouldRetry,
  )
  return { status: shouldRetry ? 'retry' : 'failed' }
}

export async function processDueNotifications(env, scheduledTime = Date.now()) {
  configureWebPush(env)
  await recoverStaleClaims(
    env.DB,
    scheduledTime,
    CLAIM_TIMEOUT_MS,
    MAX_DELIVERY_ATTEMPTS,
  )

  const jobs = await getDueJobs(
    env.DB,
    scheduledTime,
    DIRECT_DELIVERY_BATCH_SIZE,
  )
  const summary = { due: jobs.length, sent: 0, failed: 0, retry: 0, skipped: 0 }

  for (const job of jobs) {
    const result = await deliverJob(env, job, scheduledTime)
    summary[result.status] += 1
  }

  await deleteOldJobs(env.DB, scheduledTime - HISTORY_RETENTION_MS)

  console.log(JSON.stringify({ event: 'notification_batch', ...summary }))
  return summary
}
