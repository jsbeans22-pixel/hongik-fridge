export function isCurrentNotificationSyncRevision(outbox, revision) {
  return Boolean(
    typeof revision === 'string' &&
    revision &&
    outbox?.revision === revision,
  )
}
