export const NOTIFICATION_PERMISSION = {
  DEFAULT: 'default',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
  IOS_INSTALL_REQUIRED: 'ios-install-required',
  IOS_VERSION_UNSUPPORTED: 'ios-version-unsupported',
}

const MINIMUM_IOS_PUSH_VERSION = [16, 4]

function isAppleMobileDevice(navigatorObject) {
  return /iPad|iPhone|iPod/.test(navigatorObject.userAgent) || (
    navigatorObject.platform === 'MacIntel' && navigatorObject.maxTouchPoints > 1
  )
}

function getAppleMobileOsVersion(userAgent) {
  const match = userAgent.match(/OS (\d+)[_.](\d+)/) ||
    userAgent.match(/Version\/(\d+)\.(\d+)/)

  return match ? [Number(match[1]), Number(match[2])] : null
}

function isVersionBefore([major, minor], [minimumMajor, minimumMinor]) {
  return major < minimumMajor || (major === minimumMajor && minor < minimumMinor)
}

function isStandalone(environment) {
  return environment.navigator.standalone === true ||
    environment.matchMedia?.('(display-mode: standalone)').matches === true
}

export function getNotificationPermission(environment = window) {
  const navigatorObject = environment.navigator
  const supportsPush =
    environment.isSecureContext &&
    'Notification' in environment &&
    'serviceWorker' in navigatorObject &&
    'PushManager' in environment

  if (supportsPush) return environment.Notification.permission

  if (isAppleMobileDevice(navigatorObject)) {
    const version = getAppleMobileOsVersion(navigatorObject.userAgent)

    if (version && isVersionBefore(version, MINIMUM_IOS_PUSH_VERSION)) {
      return NOTIFICATION_PERMISSION.IOS_VERSION_UNSUPPORTED
    }

    if (!isStandalone(environment)) {
      return NOTIFICATION_PERMISSION.IOS_INSTALL_REQUIRED
    }
  }

  return NOTIFICATION_PERMISSION.UNSUPPORTED
}

export async function requestNotificationPermission(environment = window) {
  const permission = getNotificationPermission(environment)

  if (permission === NOTIFICATION_PERMISSION.IOS_INSTALL_REQUIRED) {
    throw new Error('홈 화면에 추가해야 사용 가능해요')
  }

  if (permission === NOTIFICATION_PERMISSION.IOS_VERSION_UNSUPPORTED) {
    throw new Error('16.4 OS 이상 버전에서만 가능해요')
  }

  if (permission === NOTIFICATION_PERMISSION.UNSUPPORTED) {
    throw new Error('이 브라우저에서는 푸시 알림을 지원하지 않아요.')
  }

  return environment.Notification.requestPermission()
}
