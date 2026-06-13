import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog } from '../types'
import { workoutKeys } from './query-keys'

export function useWorkoutLog(logId: string) {
  return useQuery({
    queryKey: workoutKeys.log(logId),
    queryFn: () => apiClient.get<WorkoutLog>(`/workouts/${logId}`).then((r) => r.data),
    enabled: Boolean(logId),
  })
}
