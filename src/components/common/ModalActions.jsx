export default function ModalActions({ confirmLabel, onConfirm, onClose, destructive = false, submit = false }) {
  return (
    <>
      <button type={submit ? 'submit' : 'button'} onClick={onConfirm} className="w-full py-4 rounded-2xl font-bold text-lg transition-all enabled:active:scale-95 mb-3 motion-reduce:transform-none motion-reduce:transition-none" style={{ background: destructive ? '#f04452' : 'var(--primary)', color: 'white', letterSpacing: '-0.3px' }}>{confirmLabel}</button>
      <button type="button" onClick={onClose} className="w-full py-4 rounded-2xl font-bold text-lg" style={{ background: 'var(--background)', color: 'var(--muted-foreground)', letterSpacing: '-0.3px' }}>닫기</button>
    </>
  )
}
