import {
  MAX_STORAGE_DAYS,
  MIN_STORAGE_DAYS,
} from '../../db/storageSettingsRepository'
import { getStepperButtonStyle } from '../../utils/stepperButtonStyle'

export default function StorageDaysStepper({ value, onDecrease, onIncrease }) {
  const decreaseDisabled = value <= MIN_STORAGE_DAYS
  const increaseDisabled = value >= MAX_STORAGE_DAYS
  const buttonClass =
    'flex h-14 w-14 items-center justify-center rounded-full text-3xl font-light transition-all enabled:active:scale-95 disabled:cursor-default motion-reduce:transform-none motion-reduce:transition-none'

  return (
    <div className="mb-8 flex items-center gap-4 px-1">
      <button
        type="button"
        aria-label="보관 기한 줄이기"
        disabled={decreaseDisabled}
        onClick={onDecrease}
        className={buttonClass}
        style={getStepperButtonStyle(decreaseDisabled)}
      >
        −
      </button>
      <div className="flex-1 text-center" aria-live="polite">
        <span
          className="text-5xl font-bold"
          style={{ color: 'var(--foreground)', letterSpacing: '-1px' }}
        >
          {value}
        </span>
        <span className="ml-1 text-2xl font-semibold text-[var(--muted-foreground)]">
          일
        </span>
      </div>
      <button
        type="button"
        aria-label="보관 기한 늘리기"
        disabled={increaseDisabled}
        onClick={onIncrease}
        className={buttonClass}
        style={getStepperButtonStyle(increaseDisabled)}
      >
        +
      </button>
    </div>
  )
}
