const feedbackEndpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT

export async function submitFeedback({ category, message }) {
  if (!feedbackEndpoint) {
    throw new Error('피드백 전송 주소가 아직 설정되지 않았어요.')
  }

  const response = await fetch(feedbackEndpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: `[홍익냉장고] ${category}`,
      category,
      message,
    }),
  })

  if (!response.ok) {
    let errorMessage = '전송하지 못했어요. 잠시 후 다시 시도해 주세요.'

    try {
      const result = await response.json()
      const firstError = result.errors?.[0]?.message
      if (firstError) errorMessage = firstError
    } catch {
      // 응답 본문이 JSON이 아니면 사용자용 기본 문구를 사용한다.
    }

    throw new Error(errorMessage)
  }
}
