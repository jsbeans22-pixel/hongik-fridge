export function createLatestTaskQueue({ onStart, onIdle } = {}) {
  let pendingTask = null
  let runningPromise = null

  async function drain() {
    onStart?.()

    try {
      while (pendingTask) {
        const nextTask = pendingTask
        pendingTask = null

        try {
          await nextTask.run()
        } catch (error) {
          await nextTask.onError?.(error)
        }
      }
    } finally {
      runningPromise = null
      onIdle?.()
    }
  }

  return {
    enqueue(run, { onError } = {}) {
      pendingTask = { run, onError }

      if (!runningPromise) runningPromise = drain()
      return runningPromise
    },

    clear() {
      pendingTask = null
    },

    hasPending() {
      return pendingTask !== null
    },

    isRunning() {
      return runningPromise !== null
    },

    async clearAndWait() {
      pendingTask = null
      await runningPromise
    },
  }
}
