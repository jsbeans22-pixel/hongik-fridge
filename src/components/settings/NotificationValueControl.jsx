import NotificationStepButton from './NotificationStepButton'

export default function NotificationValueControl({
  value,
  valueColor = 'var(--foreground)',
  onDecrease,
  onIncrease,
  decreaseDisabled = false,
  increaseDisabled = false,
  label,
}) {
  return (
    <div className="flex items-center gap-3">
      <NotificationStepButton label={`${label} 줄이기`} onClick={onDecrease} disabled={decreaseDisabled} card>
        −
      </NotificationStepButton>
      <span
        className="w-16 text-center text-base font-bold"
        style={{ color: valueColor, letterSpacing: '-0.3px' }}
      >
        {value}
      </span>
      <NotificationStepButton label={`${label} 늘리기`} onClick={onIncrease} disabled={increaseDisabled} card>
        +
      </NotificationStepButton>
    </div>
  )
}
