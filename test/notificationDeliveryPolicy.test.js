import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldDisplayNotificationFromState } from '../src/utils/notificationDeliveryPolicy.js'

test('suppresses every push while the local notification schedule is changing', () => {
  assert.equal(shouldDisplayNotificationFromState('old-job', {
    activeJobIds: ['old-job'],
    dirty: true,
  }), false)
})

test('suppresses a push removed from the latest acknowledged schedule', () => {
  assert.equal(shouldDisplayNotificationFromState('deleted-food-job', {
    activeJobIds: ['remaining-food-job'],
    dirty: false,
  }), false)
})

test('displays a push that belongs to the latest acknowledged schedule', () => {
  assert.equal(shouldDisplayNotificationFromState('remaining-food-job', {
    activeJobIds: ['remaining-food-job'],
    dirty: false,
  }), true)
})

test('allows legacy pushes until local delivery state has been initialized', () => {
  assert.equal(shouldDisplayNotificationFromState(undefined, null), true)
})
