export default function FeedbackSuccess({ onClose }) {
  return (
    <div className="text-center">
      <div aria-hidden="true" className="mb-4 text-5xl">
        ✅
      </div>
      <p className="mb-2 text-lg font-bold text-[var(--foreground)]">
        의견을 성공적으로 전달했어요
      </p>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        소중한 의견 감사드립니다.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-2xl bg-[var(--primary)] py-4 text-lg font-bold text-white transition-all active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
      >
        닫기
      </button>
    </div>
  )
}
