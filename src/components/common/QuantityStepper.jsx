export default function QuantityStepper({ value, onChange, min = 1, max = 99, variant = 'form', total }) {
  const consume = variant === 'consume'
  const buttonClass = `rounded-full flex items-center justify-center font-light transition-all ${consume ? 'w-11 h-11 text-2xl' : 'w-10 h-10 text-xl'}`
  return (
    <div className="flex items-center gap-4 px-1">
      <button type="button" aria-label="수량 줄이기" onClick={() => onChange(Math.max(min, value - 1))} className={buttonClass} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>−</button>
      <div className="flex-1 text-center" aria-live="polite">
        <span className={`font-bold ${consume ? 'text-3xl' : 'text-2xl'}`} style={{ color: 'var(--foreground)', letterSpacing: '-0.5px' }}>{value}개</span>
        {consume && <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>총 {total}개 중</p>}
      </div>
      <button type="button" aria-label="수량 늘리기" onClick={() => onChange(Math.min(max, value + 1))} className={buttonClass} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>+</button>
    </div>
  )
}
