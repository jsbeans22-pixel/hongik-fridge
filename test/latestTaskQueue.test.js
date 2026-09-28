import assert from 'node:assert/strict'
import test from 'node:test'
import { createLatestTaskQueue } from '../src/utils/latestTaskQueue.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

test('runs only one task at a time', async () => {
  const firstTask = deferred()
  const events = []
  let activeCount = 0
  let maximumActiveCount = 0
  const queue = createLatestTaskQueue()

  const firstRun = queue.enqueue(async () => {
    activeCount += 1
    maximumActiveCount = Math.max(maximumActiveCount, activeCount)
    events.push('first:start')
    await firstTask.promise
    events.push('first:end')
    activeCount -= 1
  })

  const secondRun = queue.enqueue(async () => {
    activeCount += 1
    maximumActiveCount = Math.max(maximumActiveCount, activeCount)
    events.push('second:start')
    activeCount -= 1
  })

  assert.deepEqual(events, ['first:start'])
  firstTask.resolve()
  await Promise.all([firstRun, secondRun])

  assert.equal(maximumActiveCount, 1)
  assert.deepEqual(events, ['first:start', 'first:end', 'second:start'])
})

test('keeps only the latest task while another task is running', async () => {
  const firstTask = deferred()
  const events = []
  const queue = createLatestTaskQueue()

  const running = queue.enqueue(async () => {
    events.push('first')
    await firstTask.promise
  })

  queue.enqueue(async () => {
    events.push('outdated')
  })
  queue.enqueue(async () => {
    events.push('latest')
  })

  assert.equal(queue.hasPending(), true)
  firstTask.resolve()
  await running

  assert.deepEqual(events, ['first', 'latest'])
  assert.equal(queue.hasPending(), false)
  assert.equal(queue.isRunning(), false)
})

test('continues with the latest task after a failure', async () => {
  const firstTask = deferred()
  const events = []
  const errors = []
  const queue = createLatestTaskQueue()

  const running = queue.enqueue(
    async () => {
      events.push('first')
      await firstTask.promise
    },
    {
      onError(error) {
        errors.push(error.message)
      },
    },
  )

  queue.enqueue(async () => {
    events.push('latest')
  })

  firstTask.reject(new Error('sync failed'))
  await running

  assert.deepEqual(errors, ['sync failed'])
  assert.deepEqual(events, ['first', 'latest'])
})

test('reports busy and idle once for a serialized batch', async () => {
  const firstTask = deferred()
  const states = []
  const queue = createLatestTaskQueue({
    onStart: () => states.push('busy'),
    onIdle: () => states.push('idle'),
  })

  const running = queue.enqueue(() => firstTask.promise)
  queue.enqueue(async () => {})
  firstTask.resolve()
  await running

  assert.deepEqual(states, ['busy', 'idle'])
})

test('clears pending work and waits for the running task before disabling', async () => {
  const firstTask = deferred()
  const events = []
  const queue = createLatestTaskQueue()

  queue.enqueue(async () => {
    events.push('sync:start')
    await firstTask.promise
    events.push('sync:end')
  })
  queue.enqueue(async () => {
    events.push('stale-sync')
  })

  const stopped = queue.clearAndWait().then(() => events.push('disabled'))
  firstTask.resolve()
  await stopped

  assert.deepEqual(events, ['sync:start', 'sync:end', 'disabled'])
  assert.equal(queue.isRunning(), false)
})
