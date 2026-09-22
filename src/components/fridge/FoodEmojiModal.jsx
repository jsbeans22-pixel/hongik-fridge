import Modal from '../common/Modal'
import FoodIconButton from './FoodIconButton'
import { MORE_FOOD_ICONS } from '../../constants/foodIcons'

export default function FoodEmojiModal({ value, onSelect, onClose }) {
  return (
    <Modal title="이모지 선택" titleSpacing="mb-4" onClose={onClose}>
      <div className="mb-5 grid max-h-72 grid-cols-8 gap-1.5 overflow-y-auto p-1">
        {MORE_FOOD_ICONS.map((icon, index) => (
          <FoodIconButton
            key={index}
            icon={icon}
            selected={value === icon}
            large
            onClick={() => onSelect(icon)}
          />
        ))}
      </div>
      <button type="button" onClick={onClose} className="w-full rounded-2xl bg-[#f2f4f6] py-4 text-lg font-bold text-[#8b95a1]" style={{ letterSpacing: '-0.3px' }}>
        닫기
      </button>
    </Modal>
  )
}
