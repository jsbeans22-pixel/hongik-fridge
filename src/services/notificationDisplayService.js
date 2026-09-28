export async function clearDisplayedNotifications(serviceWorker) {
  const workerContainer = serviceWorker ?? globalThis.navigator?.serviceWorker
  if (!workerContainer?.getRegistration) return 0

  try {
    const registration = await workerContainer.getRegistration()
    if (!registration || typeof registration.getNotifications !== 'function') {
      return 0
    }

    const notifications = await registration.getNotifications()
    for (const notification of notifications) notification.close()
    return notifications.length
  } catch {
    // 알림 센터 정리 실패가 음식 저장 자체를 막아서는 안 된다.
    return 0
  }
}
