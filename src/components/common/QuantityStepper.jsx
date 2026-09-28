import { getStepperButtonStyle } from '../../utils/stepperButtonStyle'

export default function QuantityStepper({ value, onChange, min = 1, max = 99, variant = 'form', total }) {
  const consume = variant === 'consume'
  const decreaseDisabled = value <= min
  const increaseDisabled = value >= max
  const buttonClass = 'flex h-11 w-11 items-center justify-center rounded-full text-2xl font-light transition-all enabled:active:scale-95 disabled:cursor-default motion-reduce:transform-none motion-reduce:transition-none'

  return (
    <div className="flex items-center gap-4 px-1">
      <button
        type="button"
        aria-label="수량 줄이기"
        disabled={decreaseDisabled}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={buttonClass}
        style={getStepperButtonStyle(decreaseDisabled)}
      >
        −
      </button>
      <div className="flex-1 text-center" aria-live="polite">
        <span className={`font-bold ${consume ? 'text-3xl' : 'text-2xl'}`} style={{ color: 'var(--foreground)', letterSpacing: '-0.5px' }}>{value}개</span>
        {consume && <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>총 {total}개 중</p>}
      </div>
      <button
        type="button"
        aria-label="수량 늘리기"
        disabled={increaseDisabled}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={buttonClass}
        style={getStepperButtonStyle(increaseDisabled)}
      >
        +
      </button>
    </div>
  )
}
