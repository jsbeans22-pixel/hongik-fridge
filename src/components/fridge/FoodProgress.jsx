import { getFoodStatusColor } from '../../utils/foodStatus'

export default function FoodProgress({ daysRemaining, storageDays = 7 }) {
  if (daysRemaining < 0) return null
  return (
    <div aria-hidden="true" className="mt-3 ml-14 h-1 rounded-full" style={{ background: 'var(--background)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, daysRemaining / storageDays * 100))}%`, background: getFoodStatusColor(daysRemaining), opacity: 0.6 }} />
    </div>
  )
}
