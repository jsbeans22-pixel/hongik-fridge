const navigationItems = [
  { id: 'fridge', label: '냉장고', Icon: FridgeIcon },
  { id: 'settings', label: '설정', Icon: SettingsIcon },
]

export default function BottomNavigation({ activePage, onPageChange }) {
  return (
    <nav
      aria-label="메인 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e8eb] bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-lg">
        {navigationItems.map(({ id, label, Icon }) => {
          const isActive = activePage === id

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onPageChange(id)}
              className={`flex flex-1 flex-col items-center justify-center py-3 gap-1 transition-all focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#3182f6] ${
                isActive ? 'text-[#191f28]' : 'text-[#8b95a1]'
              }`}
            >
              <Icon active={isActive} />
              <span className="text-xs font-semibold" style={{ letterSpacing: '-0.2px' }}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function FridgeIcon({ active }) {
  const color = active ? 'var(--foreground)' : 'var(--muted-foreground)'
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="5" y="2" width="16" height="22" rx="3" stroke={color} strokeWidth={active ? 2.2 : 1.8} />
      <line x1="5" y1="10" x2="21" y2="10" stroke={color} strokeWidth={active ? 2.2 : 1.8} />
      <line x1="9" y1="6" x2="9" y2="8.5" stroke={color} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
      <line x1="9" y1="13" x2="9" y2="17" stroke={color} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon({ active }) {
  const color = active ? 'var(--foreground)' : 'var(--muted-foreground)'
  // 8-tooth gear: outer polygon (r=11) + inner octagon hole (r=3.5), all straight lines
  const gear = "M13 2 L16.06 5.61 L20.78 5.22 L20.39 9.94 L24 13 L20.39 16.06 L20.78 20.78 L16.06 20.39 L13 24 L9.94 20.39 L5.22 20.78 L5.61 16.06 L2 13 L5.61 9.94 L5.22 5.22 L9.94 5.61 Z"
  const hole = "M13 9.5 L15.47 10.53 L16.5 13 L15.47 15.47 L13 16.5 L10.53 15.47 L9.5 13 L10.53 10.53 Z"
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 26 26" fill={color}>
      <path fillRule="evenodd" d={`${gear} ${hole}`} />
    </svg>
  )
}


