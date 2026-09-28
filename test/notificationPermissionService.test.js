import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getNotificationPermission,
  NOTIFICATION_PERMISSION,
} from '../src/services/notificationPermissionService.js'

function createEnvironment({
  userAgent,
  standalone = false,
  supportsPush = false,
  permission = 'default',
}) {
  const environment = {
    isSecureContext: true,
    navigator: {
      userAgent,
      platform: 'iPad',
      maxTouchPoints: 5,
      standalone,
    },
    matchMedia: () => ({ matches: standalone }),
  }

  if (supportsPush) {
    environment.Notification = { permission }
    environment.PushManager = function PushManager() {}
    environment.navigator.serviceWorker = {}
  }

  return environment
}

test('asks supported iPadOS Safari users to install the app on the Home Screen', () => {
  const environment = createEnvironment({
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) Version/17.5 Mobile/15E148 Safari/604.1',
  })

  assert.equal(
    getNotificationPermission(environment),
    NOTIFICATION_PERMISSION.IOS_INSTALL_REQUIRED,
  )
})

test('asks older iPadOS users to update before installing the app', () => {
  const environment = createEnvironment({
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_3 like Mac OS X) Version/16.3 Mobile/15E148 Safari/604.1',
  })

  assert.equal(
    getNotificationPermission(environment),
    NOTIFICATION_PERMISSION.IOS_VERSION_UNSUPPORTED,
  )
})

test('uses the browser notification permission when push is available', () => {
  const environment = createEnvironment({
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) Version/17.5 Mobile/15E148 Safari/604.1',
    standalone: true,
    supportsPush: true,
    permission: 'granted',
  })

  assert.equal(getNotificationPermission(environment), NOTIFICATION_PERMISSION.GRANTED)
})
