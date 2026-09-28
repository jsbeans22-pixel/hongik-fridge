export function shouldDisplayNotificationFromState(jobId, state) {
  if (!jobId || !state) return true
  if (state.dirty) return false
  if (!Array.isArray(state.activeJobIds)) return true
  return state.activeJobIds.includes(jobId)
}
