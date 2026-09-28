import { useState } from 'react'
import FormField from '../common/FormField'
import QuantityStepper from '../common/QuantityStepper'
import StorageTypeSelector from './StorageTypeSelector'
import FoodIconPicker from './FoodIconPicker'
import { guessFoodIcon } from '../../constants/foodIcons'
import { getTodayInKorea } from '../../utils/date'
import ModalActions from '../common/ModalActions'

const inputClass =
  'w-full min-w-0 rounded-2xl border-0 bg-[#f2f4f6] px-4 py-3 text-base outline-none'

export default function FoodForm({
  initialValues,
  submitLabel = '추가하기',
  onSubmit,
  onCancel,
}) {
  const today = getTodayInKorea()
  const [values, setValues] = useState(() => ({
    name: initialValues?.name ?? '',
    storageType: initialValues?.storageType ?? '냉장',
    quantity: initialValues?.quantity ?? 1,
    icon: initialValues?.icon ?? '🍎',
    startDate: initialValues?.startDate ?? getTodayInKorea(),
    autoIcon: !initialValues,
  }))
  const [error, setError] = useState('')

  function updateField(field, value) {
    setValues((previous) => ({ ...previous, [field]: value }))
    setError('')
  }

  const selectedIcon = values.autoIcon
    ? (guessFoodIcon(values.name) ?? values.icon)
    : values.icon

  function handleSubmit(event) {
    event.preventDefault()

    if (!values.name.trim()) {
      setError('음식 이름을 입력해주세요.')
      return
    }

    onSubmit({
      ...values,
      name: values.name.trim(),
      icon: selectedIcon,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="음식 이름">
        <input
          type="text"
          aria-label="음식 이름"
          required
          maxLength={80}
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="예: 우유, 소고기, 치킨"
          className={inputClass}
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.3px' }}
        />
      </FormField>

      <FormField label="보관 방식">
        <StorageTypeSelector
          value={values.storageType}
          onChange={(value) => updateField('storageType', value)}
        />
      </FormField>

      <FormField label="수량">
        <QuantityStepper
          value={values.quantity}
          onChange={(value) => updateField('quantity', value)}
        />
      </FormField>

      <FormField label="음식 아이콘">
        <FoodIconPicker
          value={values.icon}
          automatic={values.autoIcon}
          onAutomaticChange={(automatic) => {
            setValues((previous) => ({
              ...previous,
              autoIcon: automatic,
            }))
          }}
          onChange={(icon) => updateField('icon', icon)}
        />
      </FormField>

      <FormField label="보관 시작일" className="mb-4">
        <input
          type="date"
          aria-label="보관 시작일"
          required
          max={today}
          value={values.startDate}
          onChange={(event) => updateField('startDate', event.target.value)}
          className={inputClass}
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.2px' }}
        />
      </FormField>

      {error && (
        <p role="alert" className="text-sm text-[#f04452]">
          {error}
        </p>
      )}

      <ModalActions submit confirmLabel={submitLabel} onClose={onCancel} />
    </form>
  )
}
