export default function InstallGuideRow({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-4 text-center text-base font-semibold text-[var(--primary)] transition-opacity active:opacity-60"
    >
      앱 설치 방법
    </button>
  )
}
