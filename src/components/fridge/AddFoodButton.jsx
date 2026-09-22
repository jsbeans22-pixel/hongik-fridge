export default function AddFoodButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3182f6] py-4 text-xl font-bold text-white transition-all enabled:active:scale-95 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3182f6]"
      style={{ letterSpacing: '-0.3px' }}
    >
      음식 추가하기
    </button>
  )
}
