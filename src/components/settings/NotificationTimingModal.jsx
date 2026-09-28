import Modal from '../common/Modal'
import ModalActions from '../common/ModalActions'
import NotificationCountControl from './NotificationCountControl'
import NotificationScheduleList from './NotificationScheduleList'

export default function NotificationTimingModal({
  notificationTimes,
  maxDaysBefore,
  canDecreaseCount,
  canIncreaseCount,
  onDecreaseCount,
  onIncreaseCount,
  onDecreaseDaysBefore,
  onIncreaseDaysBefore,
  onDecreaseDayHour,
  onIncreaseDayHour,
  onSave,
  onClose,
  busy,
  error,
}) {
  return (
    <Modal
      title="알림 설정"
      titleSpacing="mb-1"
      onClose={onClose}
      busy={busy}
      error={error}
    >
      <p
        className="mb-6 text-center text-sm"
        style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}
      >
        만료 전 언제 알림을 받을지 설정하세요
      </p>
      <NotificationCountControl
        count={notificationTimes.length}
        canDecrease={canDecreaseCount}
        canIncrease={canIncreaseCount}
        onDecrease={onDecreaseCount}
        onIncrease={onIncreaseCount}
      />
      <NotificationScheduleList
        notificationTimes={notificationTimes}
        maxDaysBefore={maxDaysBefore}
        onDecreaseDaysBefore={onDecreaseDaysBefore}
        onIncreaseDaysBefore={onIncreaseDaysBefore}
        onDecreaseDayHour={onDecreaseDayHour}
        onIncreaseDayHour={onIncreaseDayHour}
      />
      <ModalActions confirmLabel="저장하기" onConfirm={onSave} onClose={onClose} />
    </Modal>
  )
}
