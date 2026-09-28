import {
  formatNotificationDay,
  formatNotificationDayHour,
} from '../../utils/notificationTime'
import NotificationValueControl from './NotificationValueControl'

export default function NotificationScheduleCard({
  notification,
  index,
  maxDaysBefore,
  onDecreaseDaysBefore,
  onIncreaseDaysBefore,
  onDecreaseDayHour,
  onIncreaseDayHour,
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--background)]">
      <div className="flex items-center justify-between px-4 py-3">
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}
        >
          알림 {index + 1}
        </span>
        <NotificationValueControl
          label={`알림 ${index + 1} 시점`}
          value={formatNotificationDay(notification.daysBefore)}
          decreaseDisabled={notification.daysBefore === 0}
          increaseDisabled={notification.daysBefore === maxDaysBefore}
          onDecrease={onDecreaseDaysBefore}
          onIncrease={onIncreaseDaysBefore}
        />
      </div>

      <div aria-hidden="true" className="h-px bg-[var(--border)]" />
      <div className="flex items-center justify-between px-4 py-3">
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}
        >
          알림 시각
        </span>
        <NotificationValueControl
          label={`알림 ${index + 1} 시각`}
          value={formatNotificationDayHour(notification.dayHour)}
          valueColor="var(--primary)"
          onDecrease={onDecreaseDayHour}
          onIncrease={onIncreaseDayHour}
        />
      </div>
    </div>
  )
}
