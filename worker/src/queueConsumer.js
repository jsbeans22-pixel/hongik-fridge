import {
  QUEUE_CONSUMER_CONCURRENCY,
  QUEUE_RETRY_BASE_DELAY_SECONDS,
  QUEUE_RETRY_MAX_DELAY_SECONDS,
} from './constants.js'
import { configureWebPush } from './push.js'
import {
  getJobForDelivery,
  releaseJobForRetry,
} from './repository.js'
import { deliverJob } from './scheduler.js'

const DEFAULT_OPERATIONS = {
  configureWebPush,
  deliverJob,
  getJobForDelivery,
  releaseJobForRetry,
}

function getRetryDelaySeconds(attempts) {
  return Math.min(
    QUEUE_RETRY_BASE_DELAY_SECONDS * (2 ** Math.max(0, attempts - 1)),
    QUEUE_RETRY_MAX_DELAY_SECONDS,
  )
}

function isValidQueueBody(body) {
  return body &&
    typeof body.deviceId === 'string' &&
    typeof body.jobId === 'string' &&
    typeof body.notificationVersion === 'string'
}

async function processMessage(env, message, operations) {
  const body = message.body
  if (!isValidQueueBody(body)) {
    message.ack()
    return { status: 'failed' }
  }

  let job
  try {
    job = await operations.getJobForDelivery(
      env.DB,
      body.deviceId,
      body.jobId,
      body.notificationVersion,
    )
    if (!job) {
      message.ack()
      return { status: 'skipped' }
    }

    const result = await operations.deliverJob(env, job, Date.now())
    if (result.status === 'retry') {
      message.retry({
        delaySeconds: getRetryDelaySeconds(message.attempts),
      })
      return result
    }

    message.ack()
    return result
  } catch (cause) {
    if (job) {
      await operations.releaseJobForRetry(
        env.DB,
        job.deviceId,
        job.id,
        job.notificationVersion,
        Date.now(),
        cause?.message || 'Queue Consumer 처리 중 오류가 발생했습니다.',
      ).catch(() => {})
    }

    message.retry({
      delaySeconds: getRetryDelaySeconds(message.attempts),
    })
    return { status: 'retry' }
  }
}

export async function processNotificationQueue(
  batch,
  env,
  operations = DEFAULT_OPERATIONS,
) {
  operations.configureWebPush(env)
  const summary = {
    received: batch.messages.length,
    sent: 0,
    failed: 0,
    retry: 0,
    skipped: 0,
  }

  for (
    let index = 0;
    index < batch.messages.length;
    index += QUEUE_CONSUMER_CONCURRENCY
  ) {
    const chunk = batch.messages.slice(
      index,
      index + QUEUE_CONSUMER_CONCURRENCY,
    )
    const results = await Promise.all(
      chunk.map((message) => processMessage(env, message, operations)),
    )
    for (const result of results) summary[result.status] += 1
  }

  console.log(JSON.stringify({ event: 'notification_consumer', ...summary }))
  return summary
}
