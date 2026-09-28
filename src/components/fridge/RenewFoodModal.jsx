import { useId, useState } from 'react'
import Modal from '../common/Modal'
import ModalActions from '../common/ModalActions'
import { getFoodIconBackground } from '../../constants/foodIcons'
import { getTodayInKorea } from '../../utils/date'
import { getExpiryDate } from '../../utils/storageDeadline'

export default function RenewFoodModal({ food, storageDays, onConfirm, onClose, busy, error }) {
  const today = getTodayInKorea()
  const [renewDate, setRenewDate] = useState(today)
  const dateId = useId()

  function handleSubmit(event) {
    event.preventDefault()
    onConfirm(renewDate)
  }

  return (
    <Modal title="기간 갱신하기" hideTitle onClose={onClose} busy={busy} error={error}>
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-6">
          <div aria-hidden="true" className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3" style={{ background: getFoodIconBackground(food.icon) }}>{food.icon}</div>
          <p className="text-2xl font-bold mb-1" style={{ letterSpacing: '-0.5px' }}>{food.name}</p>
          <h2 className="text-lg font-bold" style={{ letterSpacing: '-0.5px' }}>기간 갱신하기</h2>
          <p className="text-sm mt-1 text-[var(--muted-foreground)]" style={{ letterSpacing: '-0.2px' }}>라벨지를 새로 붙였나요?</p>
        </div>
        <div className="rounded-2xl px-4 py-3 mb-5 bg-[var(--background)] text-base" style={{ letterSpacing: '-0.2px' }}>
          <div className="flex items-center justify-between gap-4">
            <span className="shrink-0 text-[var(--muted-foreground)]">보관 시작일</span>
            <span className="shrink-0 font-semibold">{food.startDate}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="shrink-0 text-[var(--muted-foreground)]">보관 만료일</span>
            <span className="shrink-0 font-semibold">{getExpiryDate(food.startDate, storageDays)}</span>
          </div>
        </div>
        <label htmlFor={dateId} className="block text-base font-semibold mb-2 text-[var(--muted-foreground)]" style={{ letterSpacing: '-0.2px' }}>새 라벨지 부착 날짜</label>
        <input id={dateId} type="date" required max={today} value={renewDate} onChange={(event) => setRenewDate(event.target.value)}
          className="w-full px-4 py-3.5 rounded-2xl text-lg mb-4 outline-none border-0 bg-[var(--background)] font-sans" />
        <div className="rounded-2xl px-4 py-3 mb-6 flex items-center justify-between bg-[#e8f3ff] text-[#3182f6] text-sm">
          <span className="font-medium" style={{ letterSpacing: '-0.2px' }}>새 만료일</span>
          <span className="font-bold" style={{ letterSpacing: '-0.3px' }}>{getExpiryDate(renewDate, storageDays) || '날짜를 선택해주세요'}</span>
        </div>
        <ModalActions confirmLabel="갱신하기" submit onClose={onClose} />
      </form>
    </Modal>
  )
}
