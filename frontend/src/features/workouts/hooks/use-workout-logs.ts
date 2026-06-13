import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog, WorkoutStatus } from '../types'
import { workoutKeys } from './query-keys'

interface WorkoutLogsParams {
  status?: WorkoutStatus
  limit?: number
  offset?: number
}

export function useWorkoutLogs(params?: WorkoutLogsParams) {
  return useQuery({
    queryKey: workoutKeys.logs(params),
    queryFn: () =>
      apiClient
        .get<WorkoutLog[]>('/workouts', { params })
        .then((r) => r.data),
  })
}
