import { formatNotificationSummary } from '../../utils/notificationTime'

export default function NotificationSummaryList({ notificationTimes }) {
  if (notificationTimes.length === 0) {
    return (
      <span
        className="text-sm font-semibold"
        style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}
      >
        알림 꺼짐
      </span>
    )
  }

  return notificationTimes.map((notification, index) => (
    <div key={notification.id} className="flex items-center justify-between">
      <span
        className="text-sm font-semibold"
        style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}
      >
        알림 {index + 1}
      </span>
      <span
        className="text-sm font-semibold"
        style={{ color: 'var(--foreground)', letterSpacing: '-0.2px' }}
      >
        {formatNotificationSummary(notification)}
      </span>
    </div>
  ))
}
