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
      <div className="mx-auto flex h-[var(--bottom-navigation-height)] max-w-lg">
        {navigationItems.map(({ id, label, Icon }) => {
          const isActive = activePage === id

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onPageChange(id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-all focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#3182f6] ${
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
      <path
        fill={color}
        fillRule="evenodd"
        d="M8.5 1.5h9A4.5 4.5 0 0 1 22 6v13a4.5 4.5 0 0 1-3 4.243V24a1.5 1.5 0 0 1-3 0v-.5H10v.5a1.5 1.5 0 0 1-3 0v-.757A4.5 4.5 0 0 1 4 19V6a4.5 4.5 0 0 1 4.5-4.5Zm.75 4A1.25 1.25 0 0 0 8 6.75v5.5a1.25 1.25 0 0 0 2.5 0v-5.5A1.25 1.25 0 0 0 9.25 5.5Z"
      />
    </svg>
  )
}

function SettingsIcon({ active }) {
  const color = active ? 'var(--foreground)' : 'var(--muted-foreground)'
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="2" y="3" width="22" height="9" rx="4.5" fill={color} />
      <circle cx="19" cy="7.5" r="3" fill="white" />
      <rect x="2" y="14" width="22" height="9" rx="4.5" fill={color} />
      <circle cx="7" cy="18.5" r="3" fill="white" />
    </svg>
  )
}


