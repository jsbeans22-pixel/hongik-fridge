import assert from 'node:assert/strict'
import { mock } from 'node:test'
import test from 'node:test'
import webpush from 'web-push'
import { sendPush } from '../src/push.js'

test('sends time-sensitive pushes with a bounded TTL', async () => {
  const subscription = {
    endpoint: 'https://push.example.com/subscription/123',
    keys: { p256dh: 'public-key', auth: 'auth-secret' },
  }
  const job = {
    id: 'food-1:notification-1:1767873600000:abc123',
    foodId: 'food-1',
    notificationId: 'notification-1',
    title: '보관 기한을 확인해 주세요',
    body: '🥛 우유의 보관 기한이 오늘까지예요.',
    url: '/',
  }
  const sendNotification = mock.method(
    webpush,
    'sendNotification',
    async () => ({ statusCode: 201 }),
  )

  await sendPush(subscription, job)

  assert.equal(sendNotification.mock.callCount(), 1)
  const [, payload, options] = sendNotification.mock.calls[0].arguments
  assert.deepEqual(JSON.parse(payload), {
    title: job.title,
    body: '우유의 보관 기한이 오늘까지예요.',
    jobId: job.id,
    tag: 'food-food-1-notification-1',
    url: '/',
    foodId: 'food-1',
    notificationId: 'notification-1',
  })
  assert.deepEqual(options, { TTL: 3600, urgency: 'high' })
})
