import assert from 'node:assert/strict'
import test from 'node:test'
import { enforceDeviceRateLimit } from '../src/rateLimit.js'

test('uses the device id as the device rate limit key', async () => {
  const deviceId = '123e4567-e89b-42d3-a456-426614174000'
  const env = {
    DEVICE_RATE_LIMITER: {
      limit: async ({ key }) => {
        assert.equal(key, `device:${deviceId}`)
        return { success: true }
      },
    },
  }

  await enforceDeviceRateLimit(env, deviceId, '/api/jobs')
})

test('fails closed when the rate limit binding is missing', () => {
  assert.throws(
    () => enforceDeviceRateLimit({}, 'device-id', '/api/jobs'),
    { message: 'DEVICE_RATE_LIMITER Rate Limiting 바인딩이 없습니다.' },
  )
})
