import { getVapidPublicKey } from './pushApiService'

const PUSH_OPERATION_TIMEOUT_MS = 10_000
let pushSubscriptionPromise = null

async function withTimeout(operation, message) {
  let timeoutId

  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error(message)),
          PUSH_OPERATION_TIMEOUT_MS,
        )
      }),
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function base64UrlToUint8Array(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const decoded = atob(base64)

  return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
}

function hasSameApplicationServerKey(subscription, expectedKey) {
  const currentKey = subscription.options.applicationServerKey
  if (!currentKey) return false

  const currentBytes = new Uint8Array(currentKey)

  return currentBytes.length === expectedKey.length &&
    currentBytes.every((value, index) => value === expectedKey[index])
}

async function createPushSubscription() {
  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    '알림 서비스를 준비하지 못했어요. 앱을 새로고침해주세요.',
  )
  const currentSubscription = await withTimeout(
    registration.pushManager.getSubscription(),
    '기존 알림 정보를 확인하지 못했어요. 잠시 후 다시 시도해주세요.',
  )
  const publicKey = await getVapidPublicKey()
  const applicationServerKey = base64UrlToUint8Array(publicKey)

  if (
    currentSubscription &&
    hasSameApplicationServerKey(currentSubscription, applicationServerKey)
  ) {
    return currentSubscription
  }

  await currentSubscription?.unsubscribe()

  return withTimeout(
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }),
    '푸시 알림을 등록하지 못했어요. 잠시 후 다시 시도해주세요.',
  )
}

export function getOrCreatePushSubscription() {
  if (!pushSubscriptionPromise) {
    pushSubscriptionPromise = createPushSubscription().catch((error) => {
      pushSubscriptionPromise = null
      throw error
    })
  }

  return pushSubscriptionPromise
}

export async function unsubscribeFromPushNotifications() {
  pushSubscriptionPromise = null
  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    '알림 서비스를 준비하지 못했어요. 앱을 새로고침해주세요.',
  )
  const subscription = await withTimeout(
    registration.pushManager.getSubscription(),
    '기존 알림 정보를 확인하지 못했어요. 잠시 후 다시 시도해주세요.',
  )

  if (!subscription) return true

  return withTimeout(
    subscription.unsubscribe(),
    '푸시 알림 해제를 완료하지 못했어요. 잠시 후 다시 시도해주세요.',
  )
}
