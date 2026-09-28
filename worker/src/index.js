import { route } from './router.js'
import { processDeadLetterQueue } from './deadLetterConsumer.js'
import { dispatchDueNotifications } from './queueDispatcher.js'
import { processNotificationQueue } from './queueConsumer.js'
import { processDueNotifications } from './scheduler.js'

const DEFAULT_NOTIFICATION_DLQ_NAME = 'hongik-fridge-notifications-dlq'

export default {
  fetch(request, env) {
    return route(request, env)
  },

  scheduled(controller, env, ctx) {
    const task = env.NOTIFICATION_DELIVERY_MODE === 'direct'
      ? processDueNotifications(env, controller.scheduledTime)
      : dispatchDueNotifications(env, controller.scheduledTime)
    ctx.waitUntil(task)
  },

  queue(batch, env) {
    if (batch.queue === (env.NOTIFICATION_DLQ_NAME ?? DEFAULT_NOTIFICATION_DLQ_NAME)) {
      return processDeadLetterQueue(batch, env)
    }
    return processNotificationQueue(batch, env)
  },
}
