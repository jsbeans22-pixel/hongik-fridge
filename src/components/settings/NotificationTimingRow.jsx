import NotificationSummaryList from './NotificationSummaryList'
import SettingsChevron from './SettingsChevron'

export default function NotificationTimingRow({ notificationTimes, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-3 px-5 pt-4 pb-4 text-left transition-all active:opacity-70"
    >
      <div className="flex w-full items-center justify-between">
        <span
          className="text-base font-medium"
          style={{ color: 'var(--foreground)', letterSpacing: '-0.3px' }}
        >
          알림
        </span>
        <SettingsChevron />
      </div>
      <div className="flex w-full flex-col gap-2">
        <NotificationSummaryList notificationTimes={notificationTimes} />
      </div>
    </button>
  )
}
