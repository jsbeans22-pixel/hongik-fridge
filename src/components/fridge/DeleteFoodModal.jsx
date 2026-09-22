import Modal from '../common/Modal'
import ModalActions from '../common/ModalActions'
import FoodConfirmationHeader from './FoodConfirmationHeader'

export default function DeleteFoodModal({ food, onConfirm, onClose, busy = false, error = '' }) {
  return (
    <Modal title="음식 삭제" hideTitle onClose={onClose} busy={busy} error={error}>
      <FoodConfirmationHeader food={food} description="목록에서 삭제할까요?" />
      <ModalActions confirmLabel="삭제할게요" onConfirm={onConfirm} onClose={onClose} destructive />
    </Modal>
  )
}
