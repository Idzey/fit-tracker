import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { ProgressSummary } from '../types'
import { workoutKeys } from './query-keys'

export function useMyProgress() {
  return useQuery({
    queryKey: workoutKeys.progress(),
    queryFn: () => apiClient.get<ProgressSummary>('/progress').then((r) => r.data),
  })
}
