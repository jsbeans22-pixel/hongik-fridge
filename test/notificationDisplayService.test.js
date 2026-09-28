import assert from 'node:assert/strict'
import test from 'node:test'
import { clearDisplayedNotifications } from '../src/services/notificationDisplayService.js'

test('closes every displayed app notification after notification data changes', async () => {
  const closed = []
  const serviceWorker = {
    async getRegistration() {
      return {
        async getNotifications() {
          return [
            { close: () => closed.push('first') },
            { close: () => closed.push('second') },
          ]
        },
      }
    },
  }

  const count = await clearDisplayedNotifications(serviceWorker)

  assert.equal(count, 2)
  assert.deepEqual(closed, ['first', 'second'])
})

test('does nothing when no service worker registration exists', async () => {
  const count = await clearDisplayedNotifications({
    getRegistration: async () => undefined,
  })

  assert.equal(count, 0)
})
