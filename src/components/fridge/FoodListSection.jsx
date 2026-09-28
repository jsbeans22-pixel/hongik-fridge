import FoodItem from './FoodItem'
import EmptyFridge from './EmptyFridge'
import { useFoods } from '../../hooks/useFoods'
import { useKoreaToday } from '../../hooks/useKoreaToday'
import { useStorageDays } from '../../hooks/useStorageDays'
import { getDaysRemaining } from '../../utils/storageDeadline'

export default function FoodListSection() {
  const { foods, isLoading, error } = useFoods()
  const today = useKoreaToday()
  const storageDays = useStorageDays()

  if (isLoading) {
    return (
      <p role="status" className="px-5 py-8 text-center text-[#6b7684]">
        음식 목록을 불러오는 중이에요…
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" className="px-5 py-8 text-center text-[#f04452]">
        {error}
      </p>
    )
  }

  if (foods.length === 0) {
    return <EmptyFridge />
  }

  return (
    <section aria-label="보관 중인 음식">
      <ul className="mx-5 overflow-hidden rounded-3xl bg-white">
        {foods.map((food, index) => (
          <li key={food.id}>
            {index > 0 && <div style={{ height: 1, background: getDaysRemaining(food.startDate, today, storageDays) < 0 ? '#fca5a5' : 'var(--border)' }} />}
            <FoodItem
              food={food}
              daysRemaining={getDaysRemaining(food.startDate, today, storageDays)}
              storageDays={storageDays}
            />
          </li>
        ))}
      </ul>
      <div className="h-10" />
    </section>
  )
}
