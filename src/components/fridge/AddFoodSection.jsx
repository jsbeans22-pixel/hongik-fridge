import { useState } from 'react'
import AddFoodButton from './AddFoodButton'
import FoodFormModal from './FoodFormModal'
import { addFood } from '../../db/foodRepository'
import { useDbAction } from '../../hooks/useDbAction'

export default function AddFoodSection() {
  const [isOpen, setIsOpen] = useState(false)
  const { run, isPending, error, clearError } = useDbAction()

  function openModal() {
    clearError()
    setIsOpen(true)
  }

  function handleSubmit(values) {
    run(() => addFood(values), () => setIsOpen(false))
  }

  return (
    <>
      <div className="px-5 pt-6 pb-4">
        <AddFoodButton onClick={openModal} />
      </div>

      {isOpen && (
        <FoodFormModal
          onSubmit={handleSubmit}
          onClose={() => setIsOpen(false)}
          busy={isPending}
          error={error}
        />
      )}
    </>
  )
}
