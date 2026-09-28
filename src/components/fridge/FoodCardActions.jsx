export default function FoodCardActions({ onConsume, onRenew, onEdit, onDelete }) {
  const actions = [
    { label: '먹었어요', onClick: onConsume, color: '#1da462', bg: '#edfaee' },
    { label: '기간 갱신', onClick: onRenew, color: '#3182f6', bg: '#e8f3ff' },
    { label: '수정', onClick: onEdit, color: 'var(--secondary-foreground)', bg: 'var(--background)' },
    { label: '삭제', onClick: onDelete, color: '#f04452', bg: '#fff0f0' },
  ]
  return (
    <div className="mt-4 grid w-full grid-cols-4 gap-1.5 min-[400px]:gap-2">
      {actions.map(({ label, onClick, color, bg }) => (
        <button key={label} type="button" onClick={onClick} disabled={!onClick}
          className="min-w-0 whitespace-nowrap rounded-xl px-1 py-2.5 text-[13px] font-semibold transition-all enabled:active:scale-95 disabled:cursor-default disabled:opacity-40 min-[380px]:px-2 min-[380px]:text-sm motion-reduce:transform-none motion-reduce:transition-none"
          style={{ background: bg, color, letterSpacing: '-0.1px' }}>{label}</button>
      ))}
    </div>
  )
}
