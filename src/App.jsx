import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import BottomNavigation from './components/layout/BottomNavigation'
import { useNotificationPermission } from './hooks/useNotificationPermission'
import { usePushNotificationSync } from './hooks/usePushNotificationSync'
import FridgePage from './pages/FridgePage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const [activePage, setActivePage] = useState('fridge')
  const notificationPermission = useNotificationPermission()
  const notificationSync = usePushNotificationSync(
    notificationPermission.permission,
    notificationPermission.notificationsEnabled,
    notificationPermission.preferenceReady,
  )

  function disableNotifications() {
    return notificationPermission.disableNotifications(notificationSync.stopAndWait)
  }

  return (
    <AppLayout
      navigation={
        <BottomNavigation
          activePage={activePage}
          onPageChange={setActivePage}
        />
      }
    >
      {activePage === 'fridge' ? (
        <FridgePage />
      ) : (
        <SettingsPage
          notificationPermission={notificationPermission}
          notificationSync={notificationSync}
          onDisableNotifications={disableNotifications}
        />
      )}
    </AppLayout>
  )
}
