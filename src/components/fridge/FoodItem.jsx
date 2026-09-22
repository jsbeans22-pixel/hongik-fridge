import { useState } from 'react'
import FoodCard from './FoodCard'
import ConsumeFoodModal from './ConsumeFoodModal'
import DeleteFoodModal from './DeleteFoodModal'
import FoodFormModal from './FoodFormModal'
import RenewFoodModal from './RenewFoodModal'
import { consumeFood, updateFood, deleteFood, renewFood } from '../../db/foodRepository'
import { useDbAction } from '../../hooks/useDbAction'

export default function FoodItem({
  food,
  daysRemaining,
}) {
  const [activeModal, setActiveModal] = useState(null)
  const { run, isPending, error, clearError } = useDbAction()

  function openModal(name) {
    clearError()
    setActiveModal(name)
  }

  function closeModal() {
    setActiveModal(null)
  }

  function handleConsume(quantity) {
    run(() => consumeFood(food.id, quantity), closeModal)
  }

  function handleUpdate(values) {
    run(() => updateFood(food.id, values), closeModal)
  }

  function handleDelete() {
    run(() => deleteFood(food.id), closeModal)
  }

  function handleRenew(startDate) {
    run(() => renewFood(food.id, startDate), closeModal)
  }

  return (
    <>
      <FoodCard
        food={food}
        daysRemaining={daysRemaining}
        onConsume={() => openModal('consume')}
        onEdit={() => openModal('edit')}
        onDelete={() => openModal('delete')}
        onRenew={daysRemaining === 7 ? undefined : () => openModal('renew')}
      />

      {activeModal === 'renew' && (
        <RenewFoodModal food={food} busy={isPending} error={error}
          onConfirm={handleRenew} onClose={closeModal} />
      )}

      {activeModal === 'consume' && (
        <ConsumeFoodModal
          busy={isPending}
          error={error}
          food={food}
          onConfirm={handleConsume}
          onClose={closeModal}
        />
      )}

      {activeModal === 'edit' && (
        <FoodFormModal
          busy={isPending}
          error={error}
          mode="edit"
          initialValues={food}
          onSubmit={handleUpdate}
          onClose={closeModal}
        />
      )}

      {activeModal === 'delete' && (
        <DeleteFoodModal
          busy={isPending}
          error={error}
          food={food}
          onConfirm={handleDelete}
          onClose={closeModal}
        />
      )}
    </>
  )
}
