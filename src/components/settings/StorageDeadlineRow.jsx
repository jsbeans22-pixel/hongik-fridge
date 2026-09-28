import SettingsChevron from './SettingsChevron'

export default function StorageDeadlineRow({ storageDays, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-5 py-4 text-left transition-all active:opacity-70"
    >
      <span
        className="text-base font-medium"
        style={{ color: 'var(--foreground)', letterSpacing: '-0.3px' }}
      >
        보관 기한
      </span>
      <span className="flex items-center gap-1">
        <span
          className="text-base"
          style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}
        >
          {storageDays}일
        </span>
        <SettingsChevron />
      </span>
    </button>
  )
}
