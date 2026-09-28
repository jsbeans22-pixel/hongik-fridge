import { recordDeadLetters } from './repository.js'

const MAX_STORED_PAYLOAD_LENGTH = 4_000

function serializeBody(body) {
  try {
    return JSON.stringify(body).slice(0, MAX_STORED_PAYLOAD_LENGTH)
  } catch {
    return JSON.stringify({ error: '직렬화할 수 없는 DLQ 메시지입니다.' })
  }
}

function toDeadLetter(message, failedAt) {
  const body = message.body && typeof message.body === 'object'
    ? message.body
    : {}

  return {
    id: crypto.randomUUID(),
    queueMessageId: String(message.id || crypto.randomUUID()),
    deviceId: typeof body.deviceId === 'string' ? body.deviceId : null,
    jobId: typeof body.jobId === 'string' ? body.jobId : null,
    notificationVersion: typeof body.notificationVersion === 'string'
      ? body.notificationVersion
      : null,
    attempts: Number.isInteger(message.attempts) ? message.attempts : 0,
    failedAt,
    payload: serializeBody(message.body),
  }
}

export async function processDeadLetterQueue(batch, env, now = Date.now()) {
  const deadLetters = batch.messages.map((message) => toDeadLetter(message, now))
  await recordDeadLetters(env.DB, deadLetters)

  for (const message of batch.messages) message.ack()

  const summary = {
    queue: batch.queue,
    recorded: deadLetters.length,
    failedAt: now,
  }
  console.error(JSON.stringify({ event: 'notification_dead_letter', ...summary }))
  return summary
}
