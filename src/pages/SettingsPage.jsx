import FeedbackModal from '../components/settings/FeedbackModal'
import FeedbackRow from '../components/settings/FeedbackRow'
import InstallGuideModal from '../components/settings/InstallGuideModal'
import InstallGuideRow from '../components/settings/InstallGuideRow'
import NotificationPermissionRow from '../components/settings/NotificationPermissionRow'
import NotificationTimingModal from '../components/settings/NotificationTimingModal'
import NotificationTimingRow from '../components/settings/NotificationTimingRow'
import SettingsCard from '../components/settings/SettingsCard'
import SettingsDivider from '../components/settings/SettingsDivider'
import SettingsHeader from '../components/settings/SettingsHeader'
import StorageDeadlineModal from '../components/settings/StorageDeadlineModal'
import StorageDeadlineRow from '../components/settings/StorageDeadlineRow'
import { useFeedbackForm } from '../hooks/useFeedbackForm'
import { useInstallGuide } from '../hooks/useInstallGuide'
import { useDeviceIdentity } from '../hooks/useDeviceIdentity'
import { useNotificationTimingSetting } from '../hooks/useNotificationTimingSetting'
import { useStorageDeadlineSetting } from '../hooks/useStorageDeadlineSetting'

export default function SettingsPage({
  notificationPermission,
  notificationSync,
  onDisableNotifications,
}) {
  const storageDeadline = useStorageDeadlineSetting()
  const notificationTiming = useNotificationTimingSetting(
    storageDeadline.storageDays,
    notificationSync.syncNotificationTimes,
  )
  const deviceIdentity = useDeviceIdentity()
  const feedback = useFeedbackForm()
  const installGuide = useInstallGuide()

  return (
    <section className="px-5 pt-8">
      <SettingsHeader />
      <SettingsCard>
        <StorageDeadlineRow
          storageDays={storageDeadline.storageDays}
          onClick={storageDeadline.open}
        />
        <SettingsDivider />
        <NotificationPermissionRow
          permission={notificationPermission.permission}
          notificationsEnabled={notificationPermission.notificationsEnabled}
          preferenceReady={notificationPermission.preferenceReady}
          disablePending={notificationPermission.disablePending}
          isPending={notificationPermission.isPending}
          pendingAction={notificationPermission.pendingAction}
          isSyncing={notificationSync.isSyncing}
          error={notificationPermission.error}
          deviceError={deviceIdentity.error}
          syncError={notificationSync.error}
          onEnable={notificationPermission.enableNotifications}
          onDisable={onDisableNotifications}
        />
        <SettingsDivider />
        <NotificationTimingRow
          notificationTimes={notificationTiming.notificationTimes}
          onClick={notificationTiming.open}
        />
      </SettingsCard>

      <div className="mt-4">
        <SettingsCard>
          <FeedbackRow onClick={feedback.open} />
        </SettingsCard>
      </div>

      <div className="mt-3">
        <InstallGuideRow onClick={installGuide.open} />
      </div>

      {installGuide.isOpen && (
        <InstallGuideModal onClose={installGuide.close} />
      )}

      {storageDeadline.isOpen && (
        <StorageDeadlineModal
          value={storageDeadline.draftDays}
          onDecrease={storageDeadline.decrease}
          onIncrease={storageDeadline.increase}
          onSave={storageDeadline.save}
          onClose={storageDeadline.close}
          busy={storageDeadline.isPending}
          error={storageDeadline.error}
        />
      )}

      {notificationTiming.isOpen && (
        <NotificationTimingModal
          notificationTimes={notificationTiming.draftTimes}
          maxDaysBefore={notificationTiming.maxDaysBefore}
          canDecreaseCount={notificationTiming.canDecreaseCount}
          canIncreaseCount={notificationTiming.canIncreaseCount}
          onDecreaseCount={notificationTiming.decreaseCount}
          onIncreaseCount={notificationTiming.increaseCount}
          onDecreaseDaysBefore={notificationTiming.decreaseDaysBefore}
          onIncreaseDaysBefore={notificationTiming.increaseDaysBefore}
          onDecreaseDayHour={notificationTiming.decreaseDayHour}
          onIncreaseDayHour={notificationTiming.increaseDayHour}
          onSave={notificationTiming.save}
          onClose={notificationTiming.close}
          busy={notificationTiming.isPending}
          error={notificationTiming.error}
        />
      )}

      {feedback.isOpen && (
        <FeedbackModal
          message={feedback.message}
          error={feedback.error}
          busy={feedback.isPending}
          isSent={feedback.isSent}
          onMessageChange={feedback.changeMessage}
          onSubmit={feedback.submit}
          onClose={feedback.close}
        />
      )}
    </section>
  )
}
