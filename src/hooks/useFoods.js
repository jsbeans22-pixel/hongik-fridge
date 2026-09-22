import { useLiveQuery } from 'dexie-react-hooks'
import { getFoods } from '../db/foodRepository'

export function useFoods() {
  const result = useLiveQuery(async () => {
    try {
      const foods = await getFoods()
      return { foods, error: '' }
    } catch {
      return {
        foods: [],
        error: '음식 목록을 불러오지 못했어요. 새로고침 후 다시 시도해주세요.',
      }
    }
  }, [])

  return {
    foods: result?.foods ?? [],
    error: result?.error ?? '',
    isLoading: result === undefined,
  }
}