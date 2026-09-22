import Modal from '../common/Modal'
import FoodForm from './FoodForm'

export default function FoodFormModal({
  mode = 'add',
  initialValues,
  onSubmit,
  onClose,
  busy = false,
  error = '',
}) {
  const isEdit = mode === 'edit'

  return (
    <Modal
      title={isEdit ? '정보 수정하기' : '음식 추가하기'}
      onClose={onClose}
      busy={busy}
      error={error}
    >
      <FoodForm
        initialValues={initialValues}
        submitLabel={isEdit ? '저장하기' : '추가하기'}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  )
}
