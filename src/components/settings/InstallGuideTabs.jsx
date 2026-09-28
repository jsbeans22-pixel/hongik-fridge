const TABS = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
]

export default function InstallGuideTabs({ value, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="운영체제 선택"
      className="mb-5 grid grid-cols-2 rounded-2xl bg-[var(--background)] p-1"
    >
      {TABS.map((tab) => {
        const isSelected = tab.id === value

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab.id)}
            className={`rounded-xl py-3 text-base font-semibold transition-all active:scale-[0.98] motion-reduce:transform-none ${
              isSelected
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'text-[var(--muted-foreground)]'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
