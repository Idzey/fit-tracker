import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog, WorkoutStatus } from '../types'
import { workoutKeys } from './query-keys'

interface WorkoutLogsParams {
  status?: WorkoutStatus
  limit?: number
  page?: number
}

interface WorkoutLogsResponse {
  data: WorkoutLog[]
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

export function useWorkoutLogs(params?: WorkoutLogsParams) {
  return useQuery({
    queryKey: workoutKeys.logs(params),
    queryFn: () =>
      apiClient
        .get<WorkoutLogsResponse>('/progress/workout-logs', { params: { limit: 50, ...params } })
        .then((r) => r.data.data),
  })
}

