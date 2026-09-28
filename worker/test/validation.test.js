import assert from 'node:assert/strict'
import test from 'node:test'
import {
  validateDeviceId,
  validateInternalUrl,
  validateJobs,
  validateSubscription,
} from '../src/validation.js'

test('validates an anonymous device id', () => {
  assert.equal(
    validateDeviceId('123e4567-e89b-42d3-a456-426614174000'),
    '123e4567-e89b-42d3-a456-426614174000',
  )
  assert.throws(() => validateDeviceId('guessable-id'))
})

test('accepts a browser push subscription', () => {
  const subscription = validateSubscription({
    endpoint: 'https://push.example.com/subscription/123',
    expirationTime: null,
    keys: { p256dh: 'public-key', auth: 'auth-secret' },
  })
  assert.equal(subscription.endpoint, 'https://push.example.com/subscription/123')
})

test('rejects duplicate notification job ids', () => {
  const now = Date.now()
  const job = {
    id: 'food-1:notification-1',
    foodId: 'food-1',
    notificationId: 'notification-1',
    scheduledAt: now + 60_000,
    title: '우유 보관 기한이 얼마 남지 않았어요',
    body: '냉장고를 확인해 주세요.',
    url: '/',
  }
  assert.throws(() => validateJobs([job, job], now))
})

test('accepts and normalizes an internal notification URL', () => {
  assert.equal(validateInternalUrl('/'), '/')
  assert.equal(
    validateInternalUrl('/fridge/../settings?source=push#notifications'),
    '/settings?source=push#notifications',
  )
})

test('rejects notification URLs that can navigate to another origin', () => {
  const externalUrls = [
    'https://evil.example/path',
    '//evil.example/path',
    '///evil.example/path',
    '/\\\\evil.example/path',
  ]

  for (const url of externalUrls) {
    assert.throws(
      () => validateInternalUrl(url),
      { message: '알림 이동 주소는 앱 내부 경로여야 합니다.' },
    )
  }
})
