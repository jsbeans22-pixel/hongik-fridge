import { getFoodIconBackground } from '../../constants/foodIcons'

export default function FoodConfirmationHeader({ food, description }) {
  return (
    <div className="text-center mb-6">
      <div aria-hidden="true" className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3" style={{ background: getFoodIconBackground(food.icon) }}>{food.icon}</div>
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)', letterSpacing: '-0.5px' }}>{food.name}</h2>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}>{description}</p>
    </div>
  )
}
