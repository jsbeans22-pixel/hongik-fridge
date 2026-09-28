import NotificationStepButton from './NotificationStepButton'

export default function NotificationCountControl({ count, canDecrease, canIncrease, onDecrease, onIncrease }) {
  return (
    <div className="mb-5 flex items-center justify-between px-1">
      <span
        className="text-base font-semibold"
        style={{ color: 'var(--foreground)', letterSpacing: '-0.3px' }}
      >
        알림 횟수
      </span>
      <div className="flex items-center gap-3">
        <NotificationStepButton label="알림 횟수 줄이기" onClick={onDecrease} disabled={!canDecrease}>
          −
        </NotificationStepButton>
        <span className="w-4 text-center text-xl font-bold text-[var(--foreground)]">
          {count}
        </span>
        <NotificationStepButton label="알림 횟수 늘리기" onClick={onIncrease} disabled={!canIncrease}>
          +
        </NotificationStepButton>
      </div>
    </div>
  )
}
