export default function FoodCardActions({ onConsume, onRenew, onEdit, onDelete }) {
  const actions = [
    { label: '먹었어요', onClick: onConsume, color: '#1da462', bg: '#edfaee' },
    { label: '기간 갱신', onClick: onRenew, color: '#3182f6', bg: '#e8f3ff' },
    { label: '수정', onClick: onEdit, color: 'var(--secondary-foreground)', bg: 'var(--background)' },
    { label: '삭제', onClick: onDelete, color: '#f04452', bg: '#fff0f0' },
  ]
  return (
    <div className="mt-3 ml-14 flex gap-2">
      {actions.map(({ label, onClick, color, bg }) => (
        <button key={label} type="button" onClick={onClick} disabled={!onClick}
          className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-all enabled:active:scale-95 disabled:cursor-default disabled:opacity-40 motion-reduce:transform-none motion-reduce:transition-none"
          style={{ background: bg, color, letterSpacing: '-0.1px' }}>{label}</button>
      ))}
    </div>
  )
}
