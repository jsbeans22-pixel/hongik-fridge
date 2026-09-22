import { useId } from 'react'

export default function StorageTypeSelector({ value, onChange }) {
  const groupName = useId()
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--background)' }}>
      {['냉장', '냉동'].map(type => (
        <label key={type} className="flex-1 cursor-pointer">
          <input type="radio" name={groupName} checked={value === type} onChange={() => onChange(type)} className="peer sr-only" />
          <span className="block py-2 rounded-xl text-center text-sm font-semibold transition-all peer-focus-visible:outline-2 peer-focus-visible:outline-[#3182f6]" style={{ background: value === type ? 'var(--card)' : 'transparent', color: value === type ? 'var(--foreground)' : 'var(--muted-foreground)', boxShadow: value === type ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>{type}</span>
        </label>
      ))}
    </div>
  )
}
