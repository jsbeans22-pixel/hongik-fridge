import ModalActions from '../common/ModalActions'

const MAX_MESSAGE_LENGTH = 1000

export default function FeedbackForm({
  message,
  error,
  onMessageChange,
  onSubmit,
  onClose,
}) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-6 text-center text-sm text-[var(--muted-foreground)]">
        불편한 점이나 의견을 알려주세요
      </p>

      <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]" htmlFor="feedback-message">
        내용
      </label>
      <textarea
        id="feedback-message"
        name="message"
        value={message}
        onChange={(event) => onMessageChange(event.target.value)}
        required
        minLength={5}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={6}
        className="w-full resize-none rounded-2xl border-0 bg-[var(--background)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
      />
      <p className="mb-4 mt-1 text-right text-xs text-[var(--muted-foreground)]">
        {message.length} / {MAX_MESSAGE_LENGTH}
      </p>

      {error && (
        <p role="alert" className="mb-4 text-sm text-[#f04452]">
          {error}
        </p>
      )}

      <ModalActions confirmLabel="보내기" submit onClose={onClose} />
    </form>
  )
}
