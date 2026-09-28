import { getFoodIconBackground } from '../../constants/foodIcons'

export default function FoodInfo({ food }) {
  return (
    <>
      <div aria-hidden="true" className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: getFoodIconBackground(food.icon) }}>{food.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-semibold text-lg truncate" style={{ color: 'var(--foreground)', letterSpacing: '-0.4px' }}>{food.name}</h2>
          <span className="text-sm font-medium px-2 py-0.5 rounded-md flex-shrink-0" style={{ background: food.storageType === '냉동' ? '#e8f3ff' : '#edfaee', color: food.storageType === '냉동' ? '#3182f6' : '#1da462', letterSpacing: '-0.1px' }}>{food.storageType}</span>
        </div>
        <p className="truncate whitespace-nowrap text-base" style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}>{food.quantity}개 · {food.startDate} 보관</p>
      </div>
    </>
  )
}
