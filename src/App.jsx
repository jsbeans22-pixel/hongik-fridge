import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import BottomNavigation from './components/layout/BottomNavigation'
import FridgePage from './pages/FridgePage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const [activePage, setActivePage] = useState('fridge')

  return (
    <AppLayout
      navigation={
        <BottomNavigation
          activePage={activePage}
          onPageChange={setActivePage}
        />
      }
    >
      {activePage === 'fridge' ? <FridgePage /> : <SettingsPage />}
    </AppLayout>
  )
}