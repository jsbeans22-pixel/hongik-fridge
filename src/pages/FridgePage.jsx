import AddFoodSection from '../components/fridge/AddFoodSection'
import FoodListSection from '../components/fridge/FoodListSection'

export default function FridgePage() {
  return (
    <section aria-label="냉장고">
      <AddFoodSection />
      <FoodListSection />
    </section>
  )
}