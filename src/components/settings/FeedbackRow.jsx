import SettingsChevron from './SettingsChevron'

export default function FeedbackRow({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-5 py-4 text-left transition-opacity active:opacity-70"
    >
      <span className="text-base font-semibold text-[var(--foreground)]">
        버그 제보 및 피드백
      </span>
      <SettingsChevron />
    </button>
  )
}
