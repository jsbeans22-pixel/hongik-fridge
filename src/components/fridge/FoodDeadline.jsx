import { getFoodStatusColor } from '../../utils/foodStatus'

export default function FoodDeadline({ daysRemaining: days }) {
  const label = days < 0 ? `D+${Math.abs(days)}` : `D-${days}`
  const description = days < 0 ? '기한 초과' : days === 0 ? '오늘 마감' : `${days}일 남음`
  return (
    <div className="flex-shrink-0 whitespace-nowrap text-right">
      <p className="text-lg font-bold" style={{ color: getFoodStatusColor(days), letterSpacing: '-0.5px' }}>{label}</p>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.1px' }}>{description}</p>
    </div>
  )
}
