import FoodInfo from './FoodInfo'
import FoodDeadline from './FoodDeadline'
import FoodCardActions from './FoodCardActions'
import FoodProgress from './FoodProgress'

export default function FoodCard({
  food,
  daysRemaining,
  storageDays,
  onConsume,
  onRenew,
  onEdit,
  onDelete,
}) {
  const isExpired = daysRemaining < 0

  return (
    <article
      aria-label={`${food.name} 보관 정보`}
      className={`px-5 py-5 ${
        isExpired ? 'bg-[#fecaca]' : 'bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <FoodInfo food={food} />
        <FoodDeadline daysRemaining={daysRemaining} />
      </div>

      <FoodProgress daysRemaining={daysRemaining} storageDays={storageDays} />
      <FoodCardActions
        onConsume={onConsume}
        onRenew={onRenew}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </article>
  )
}
