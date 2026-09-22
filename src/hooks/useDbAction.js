import { useRef, useState } from 'react'

export function useDbAction() {
  const lockRef = useRef(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  function clearError() {
    setError('')
  }

  async function run(task, onSuccess) {
    if (lockRef.current) return

    lockRef.current = true
    setIsPending(true)
    setError('')

    try {
      await task()
      onSuccess?.()
    } catch (cause) {
      // 저장소에서 직접 만든 검증 오류는 그대로 보여줘.
      const message =
        cause?.name === 'Error'
          ? cause.message
          : '저장하지 못했어요. 브라우저 저장 공간과 설정을 확인해주세요.'

      setError(message)
    } finally {
      lockRef.current = false
      setIsPending(false)
    }
  }

  return { run, isPending, error, clearError }
}