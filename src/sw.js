import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import {
  ACTIVE_NOTIFICATION_JOB_IDS_KEY,
  NOTIFICATION_SCHEDULE_DIRTY_KEY,
} from './db/settingsSchema'
import { shouldDisplayNotificationFromState } from './utils/notificationDeliveryPolicy'

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

if (import.meta.env.PROD) {
  registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))
}

function readNotificationDeliveryState() {
  return new Promise((resolve) => {
    const request = indexedDB.open('hongik-fridge')

    request.onupgradeneeded = () => request.transaction.abort()
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
    request.onsuccess = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('settings')) {
        database.close()
        resolve(null)
        return
      }

      const transaction = database.transaction('settings', 'readonly')
      const settings = transaction.objectStore('settings')
      const activeRequest = settings.get(ACTIVE_NOTIFICATION_JOB_IDS_KEY)
      const dirtyRequest = settings.get(NOTIFICATION_SCHEDULE_DIRTY_KEY)

      transaction.oncomplete = () => {
        database.close()
        resolve({
          activeJobIds: activeRequest.result?.value,
          dirty: dirtyRequest.result?.value === true,
        })
      }
      transaction.onerror = () => {
        database.close()
        resolve(null)
      }
      transaction.onabort = transaction.onerror
    }
  })
}

async function shouldDisplayNotification(jobId) {
  const state = await readNotificationDeliveryState()
  return shouldDisplayNotificationFromState(jobId, state)
}

self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data?.json() ?? {}
    } catch {
      return { body: event.data?.text() }
    }
  })()

  event.waitUntil((async () => {
    if (!await shouldDisplayNotification(data.jobId)) return

    await self.registration.showNotification(data.title ?? '홍익냉장고', {
      body: data.body ?? '보관 중인 음식을 확인해 주세요.',
      icon: '/pwa-192x192.png',
      badge: '/notification-badge.png',
      tag: data.tag,
      data: {
        url: data.url ?? '/',
        jobId: data.jobId,
        foodId: data.foodId,
        notificationId: data.notificationId,
      },
    })
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url ?? '/', self.location.origin).href

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })

    const matchingClient = windowClients.find((client) => client.url === targetUrl)
    if (matchingClient) return matchingClient.focus()

    return self.clients.openWindow(targetUrl)
  })())
})
