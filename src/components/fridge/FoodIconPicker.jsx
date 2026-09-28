import { useState } from 'react'
import { FOOD_ICONS } from '../../constants/foodIcons'
import FoodIconButton from './FoodIconButton'
import FoodEmojiModal from './FoodEmojiModal'

export default function FoodIconPicker({ value, automatic, onAutomaticChange, onChange }) {
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)

  function selectEmoji(icon) {
    onChange(icon)
    setIsEmojiOpen(false)
  }

  return (
    <>
      <button
        type="button"
        aria-pressed={automatic}
        onClick={() => onAutomaticChange(!automatic)}
        className={`mb-1.5 flex w-full items-center justify-center gap-2 rounded-2xl px-2 py-2.5 text-sm font-semibold transition-all enabled:active:scale-95 motion-reduce:transform-none motion-reduce:transition-none ${
          automatic ? 'bg-[#3182f6] text-white' : 'bg-[#f2f4f6] text-[#8b95a1]'
        }`}
      >
        <span className="whitespace-nowrap">✦ 이름으로 자동 선택</span>
        {!automatic && <span className="hidden whitespace-nowrap font-normal min-[400px]:inline">— 자동으로 아이콘을 찾아드려요</span>}
      </button>

      <div className={`grid grid-cols-10 gap-1 rounded-2xl bg-[#f2f4f6] p-2 ${automatic ? 'opacity-40' : ''}`}>
        {FOOD_ICONS.map((icon) => (
          <FoodIconButton
            key={icon}
            icon={icon}
            selected={value === icon}
            disabled={automatic}
            onClick={() => onChange(icon)}
          />
        ))}
        <button
          type="button"
          aria-label="더 많은 이모지"
          aria-haspopup="dialog"
          disabled={automatic}
          onClick={() => setIsEmojiOpen(true)}
          className="col-span-full mt-1 flex h-10 w-full items-center justify-center whitespace-nowrap rounded-xl bg-white text-sm font-bold text-[#8b95a1] transition-all enabled:active:scale-95 disabled:cursor-default motion-reduce:transform-none motion-reduce:transition-none"
        >
          + 더 많은 이모지
        </button>
      </div>

      {isEmojiOpen && (
        <FoodEmojiModal value={value} onSelect={selectEmoji} onClose={() => setIsEmojiOpen(false)} />
      )}
    </>
  )
}
