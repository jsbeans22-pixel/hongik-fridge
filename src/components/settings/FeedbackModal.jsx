import Modal from '../common/Modal'
import FeedbackForm from './FeedbackForm'
import FeedbackSuccess from './FeedbackSuccess'

export default function FeedbackModal({
  message,
  error,
  busy,
  isSent,
  onMessageChange,
  onSubmit,
  onClose,
}) {
  return (
    <Modal
      title={isSent ? '의견 전달 완료' : '버그 제보 및 피드백'}
      titleSpacing="mb-0"
      hideTitle={isSent}
      onClose={onClose}
      busy={busy}
    >
      {isSent ? (
        <FeedbackSuccess onClose={onClose} />
      ) : (
        <FeedbackForm
          message={message}
          error={error}
          onMessageChange={onMessageChange}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}
