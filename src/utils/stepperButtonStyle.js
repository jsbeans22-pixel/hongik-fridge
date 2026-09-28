export function getStepperButtonStyle(disabled, background = 'var(--background)') {
  return {
    background,
    color: disabled ? 'var(--muted-foreground)' : 'var(--foreground)',
    opacity: disabled ? 0.4 : 1,
  }
}
