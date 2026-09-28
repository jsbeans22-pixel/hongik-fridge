import Modal from '../common/Modal'
import ModalActions from '../common/ModalActions'
import StorageDaysStepper from './StorageDaysStepper'

export default function StorageDeadlineModal({
  value,
  onDecrease,
  onIncrease,
  onSave,
  onClose,
  busy,
  error,
}) {
  return (
    <Modal
      title="보관 기한 설정"
      titleSpacing="mb-2"
      onClose={onClose}
      busy={busy}
      error={error}
    >
      <p
        className="mb-8 text-center text-sm"
        style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}
      >
        음식의 기본 보관 기한을 설정하세요
      </p>
      <StorageDaysStepper
        value={value}
        onDecrease={onDecrease}
        onIncrease={onIncrease}
      />
      <ModalActions confirmLabel="저장하기" onConfirm={onSave} onClose={onClose} />
    </Modal>
  )
}
