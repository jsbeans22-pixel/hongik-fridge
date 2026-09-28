import { useState } from 'react'
import { submitFeedback } from '../services/feedbackService'

const FEEDBACK_CATEGORY = '버그 제보 및 피드백'
const MIN_MESSAGE_LENGTH = 5

export function useFeedbackForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const open = () => {
    setMessage('')
    setError('')
    setIsSent(false)
    setIsOpen(true)
  }

  const close = () => {
    if (!isPending) setIsOpen(false)
  }

  const changeMessage = (nextMessage) => {
    setMessage(nextMessage)
    setError('')
  }

  const submit = async () => {
    const trimmedMessage = message.trim()

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setError('내용을 5자 이상 입력해 주세요.')
      return
    }

    setIsPending(true)
    setError('')

    try {
      await submitFeedback({ category: FEEDBACK_CATEGORY, message: trimmedMessage })
      setIsSent(true)
    } catch (submitError) {
      setError(submitError.message || '전송하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsPending(false)
    }
  }

  return {
    isOpen,
    message,
    isPending,
    isSent,
    error,
    open,
    close,
    changeMessage,
    submit,
  }
}
