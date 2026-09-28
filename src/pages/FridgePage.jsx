import AddFoodSection from '../components/fridge/AddFoodSection'
import FoodListSection from '../components/fridge/FoodListSection'

export default function FridgePage() {
  return (
    <section
      aria-label="냉장고"
      className="flex min-h-[calc(100dvh-var(--bottom-navigation-height)-env(safe-area-inset-bottom))] flex-col"
    >
      <AddFoodSection />
      <FoodListSection />
    </section>
  )
}
