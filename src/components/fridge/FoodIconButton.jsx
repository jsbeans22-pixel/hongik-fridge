import { getFoodIconBackground } from '../../constants/foodIcons'

export default function FoodIconButton({ icon, selected, disabled = false, large = false, onClick }) {
  return (
    <button
      type="button"
      aria-label={`아이콘 ${icon}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-[#3182f6] disabled:cursor-default motion-reduce:transform-none motion-reduce:transition-none ${large ? 'w-10 h-10 text-2xl enabled:active:scale-95' : 'w-8 h-8 text-xl'}`}
      style={{
        background: selected ? getFoodIconBackground(icon) : large ? '#f2f4f6' : 'transparent',
        boxShadow: selected ? '0 0 0 2px #3182f6' : 'none',
      }}
    >
      {icon}
    </button>
  )
}
