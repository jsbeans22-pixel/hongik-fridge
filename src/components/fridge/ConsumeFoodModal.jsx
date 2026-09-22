import { useState } from 'react'
import Modal from '../common/Modal'
import ModalActions from '../common/ModalActions'
import QuantityStepper from '../common/QuantityStepper'
import FoodConfirmationHeader from './FoodConfirmationHeader'

export default function ConsumeFoodModal({ food, onConfirm, onClose, busy = false, error = '' }) {
  const [quantity, setQuantity] = useState(1)
  return (
    <Modal title="먹었어요" hideTitle onClose={onClose} busy={busy} error={error}>
      <FoodConfirmationHeader food={food} description="맛있게 드셨나요?" />
      {food.quantity >= 2 && (
        <div className="mb-6">
          <p className="text-base font-semibold mb-3" style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}>몇 개 드셨어요?</p>
          <QuantityStepper value={quantity} onChange={setQuantity} max={food.quantity} total={food.quantity} variant="consume" />
        </div>
      )}
      <ModalActions confirmLabel={`${food.quantity >= 2 ? quantity + '개 ' : ''}먹었어요`} onConfirm={() => onConfirm(quantity)} onClose={onClose} />
    </Modal>
  )
}
