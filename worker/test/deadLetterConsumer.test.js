import assert from 'node:assert/strict'
import test from 'node:test'
import { processDeadLetterQueue } from '../src/deadLetterConsumer.js'

test('records and acknowledges dead-letter messages', async () => {
  const statements = []
  const database = {
    prepare(sql) {
      return {
        bind(...bindings) {
          return { sql, bindings }
        },
      }
    },
    async batch(batchStatements) {
      statements.push(...batchStatements)
    },
  }
  let acknowledgements = 0
  const message = {
    id: 'queue-message-1',
    attempts: 4,
    body: {
      deviceId: 'device-1',
      jobId: 'job-1',
      notificationVersion: 'version-1',
    },
    ack() { acknowledgements += 1 },
  }

  const result = await processDeadLetterQueue({
    queue: 'hongik-fridge-notifications-dlq',
    messages: [message],
  }, { DB: database }, 1_000)

  assert.equal(acknowledgements, 1)
  assert.equal(statements.length, 1)
  assert.match(statements[0].sql, /INSERT OR IGNORE INTO notification_dead_letters/)
  assert.equal(statements[0].bindings[1], 'queue-message-1')
  assert.equal(statements[0].bindings[2], 'device-1')
  assert.deepEqual(result, {
    queue: 'hongik-fridge-notifications-dlq',
    recorded: 1,
    failedAt: 1_000,
  })
})

test('does not acknowledge a dead letter when persistence fails', async () => {
  let acknowledged = false
  const database = {
    prepare() {
      return { bind() { return {} } }
    },
    async batch() {
      throw new Error('D1 unavailable')
    },
  }

  await assert.rejects(processDeadLetterQueue({
    queue: 'hongik-fridge-notifications-dlq',
    messages: [{
      id: 'queue-message-1',
      attempts: 4,
      body: {},
      ack() { acknowledged = true },
    }],
  }, { DB: database }, 1_000), /D1 unavailable/)

  assert.equal(acknowledged, false)
})
