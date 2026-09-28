import assert from 'node:assert/strict'
import test from 'node:test'
import { isCurrentNotificationSyncRevision } from '../src/utils/notificationSyncPolicy.js'

test('acknowledges the current persistent sync revision', () => {
  assert.equal(isCurrentNotificationSyncRevision(
    { revision: 'revision-2' },
    'revision-2',
  ), true)
})

test('does not let an older sync clear a newer queued revision', () => {
  assert.equal(isCurrentNotificationSyncRevision(
    { revision: 'revision-2' },
    'revision-1',
  ), false)
})

test('keeps the queue pending when no revision is stored', () => {
  assert.equal(isCurrentNotificationSyncRevision(null, 'revision-1'), false)
})
