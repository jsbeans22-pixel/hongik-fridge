import NotificationScheduleCard from './NotificationScheduleCard'

export default function NotificationScheduleList({
  notificationTimes,
  maxDaysBefore,
  onDecreaseDaysBefore,
  onIncreaseDaysBefore,
  onDecreaseDayHour,
  onIncreaseDayHour,
}) {
  return (
    <div className="mb-7 flex flex-col gap-3">
      {notificationTimes.length === 0 && (
        <div className="rounded-2xl bg-[var(--background)] px-4 py-5 text-center">
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '-0.2px' }}
          >
            알림이 꺼져 있어요
          </p>
        </div>
      )}

      {notificationTimes.map((notification, index) => (
        <NotificationScheduleCard
          key={notification.id}
          notification={notification}
          maxDaysBefore={maxDaysBefore}
          index={index}
          onDecreaseDaysBefore={() => onDecreaseDaysBefore(notification.id)}
          onIncreaseDaysBefore={() => onIncreaseDaysBefore(notification.id)}
          onDecreaseDayHour={() => onDecreaseDayHour(notification.id)}
          onIncreaseDayHour={() => onIncreaseDayHour(notification.id)}
        />
      ))}
    </div>
  )
}
