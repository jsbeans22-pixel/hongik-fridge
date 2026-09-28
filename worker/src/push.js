import webpush from 'web-push'

const PUSH_TTL_SECONDS = 60 * 60

function removeLeadingEmoji(text) {
  return text.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s+/u, '')
}

export function configureWebPush(env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    throw new Error('VAPID 환경 변수가 설정되지 않았습니다.')
  }

  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  )
}

export function sendPush(subscription, job) {
  return webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: job.title,
      body: removeLeadingEmoji(job.body),
      jobId: job.id,
      tag: `food-${job.foodId}-${job.notificationId}`,
      url: job.url,
      foodId: job.foodId,
      notificationId: job.notificationId,
    }),
    {
      TTL: PUSH_TTL_SECONDS,
      urgency: 'high',
    },
  )
}

export function getPushStatusCode(error) {
  return Number(error?.statusCode ?? error?.status ?? 0)
}
