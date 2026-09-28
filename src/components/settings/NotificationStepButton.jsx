import { getStepperButtonStyle } from '../../utils/stepperButtonStyle'

export default function NotificationStepButton({ label, onClick, disabled = false, card = false, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-light transition-all enabled:active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
      style={getStepperButtonStyle(disabled, card ? 'var(--card)' : 'var(--background)')}
    >
      {children}
    </button>
  )
}
