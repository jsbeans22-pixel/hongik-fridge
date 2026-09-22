import { useEffect, useState } from 'react'
import { getTodayInKorea } from '../utils/date'

export function useKoreaToday() {
  const [today, setToday] = useState(getTodayInKorea)

  useEffect(() => {
    function refresh() {
      setToday(getTodayInKorea())
    }

    const nextMidnight =
      Date.parse(`${today}T00:00:00+09:00`) + 24 * 60 * 60 * 1000

    const timer = window.setTimeout(
      refresh,
      Math.max(0, nextMidnight - Date.now()) + 100,
    )

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [today])

  return today
}