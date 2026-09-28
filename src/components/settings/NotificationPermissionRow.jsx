import { NOTIFICATION_PERMISSION } from '../../services/notificationPermissionService'

const PERMISSION_CONTENT = {
  [NOTIFICATION_PERMISSION.DEFAULT]: {
    description: '알림은 권한이 필요해요',
    label: '알림 받기',
  },
  [NOTIFICATION_PERMISSION.GRANTED]: {
    description: '알림 권한이 허용되어 있어요',
    label: '허용됨',
  },
  [NOTIFICATION_PERMISSION.DENIED]: {
    description: '브라우저 설정에서 알림을 허용해주세요',
    label: '차단됨',
  },
  [NOTIFICATION_PERMISSION.UNSUPPORTED]: {
    description: '이 브라우저에서는 푸시 알림을 지원하지 않아요',
    label: '지원 안 함',
  },
  [NOTIFICATION_PERMISSION.IOS_INSTALL_REQUIRED]: {
    description: '홈 화면에 추가해야 사용 가능해요',
    label: '설치 필요',
  },
  [NOTIFICATION_PERMISSION.IOS_VERSION_UNSUPPORTED]: {
    description: '16.4 OS 이상 버전에서만 가능해요',
    label: '업데이트 필요',
  },
}

export default function NotificationPermissionRow({
  permission,
  notificationsEnabled,
  preferenceReady,
  disablePending,
  isPending,
  pendingAction,
  isSyncing,
  error,
  deviceError,
  syncError,
  onEnable,
  onDisable,
}) {
  const content = PERMISSION_CONTENT[permission]
  const isGranted = permission === NOTIFICATION_PERMISSION.GRANTED
  const canEnable = permission === NOTIFICATION_PERMISSION.DEFAULT || (
    isGranted && !notificationsEnabled && !disablePending
  )
  const canDisable = isGranted && (notificationsEnabled || disablePending)
  const statusDescription = (() => {
    if (!preferenceReady) return '알림 사용 설정을 확인하고 있어요'
    if (disablePending) return '알림 해제를 마무리해야 해요'
    if (isSyncing) return '알림 설정을 서버에 저장하고 있어요'
    if (isGranted && notificationsEnabled) return '알림을 받고 있어요'
    if (isGranted) return '알림이 꺼져 있어요'
    return content.description
  })()
  const message = error || deviceError || syncError || statusDescription
  const hasError = Boolean(error || deviceError || syncError)

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p
          className="text-base font-medium"
          style={{ color: 'var(--foreground)', letterSpacing: '-0.3px' }}
        >
          푸시 알림
        </p>
        <p
          aria-live="polite"
          className={`mt-1 text-sm ${hasError ? 'text-[#f04452]' : 'text-[var(--muted-foreground)]'}`}
        >
          {message}
        </p>
      </div>

      {(canEnable || canDisable) ? (
        <button
          type="button"
          onClick={canDisable ? onDisable : onEnable}
          disabled={isPending || isSyncing || !preferenceReady}
          className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all enabled:active:scale-95 disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none ${
            canDisable
              ? 'bg-[var(--background)] text-[var(--muted-foreground)]'
              : 'bg-[var(--primary)] text-white'
          }`}
        >
          {isPending || isSyncing
            ? (pendingAction === 'disable' ? '끄는 중' : '설정 중')
            : (canDisable
              ? (disablePending ? '끄기 재시도' : '알림 끄기')
              : '알림 받기')}
        </button>
      ) : (
        <span
          className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${
            isGranted && notificationsEnabled
              ? 'bg-[#e8f8ef] text-[#00a661]'
              : 'bg-[var(--background)] text-[var(--muted-foreground)]'
          }`}
        >
          {content.label}
        </span>
      )}
    </div>
  )
}
