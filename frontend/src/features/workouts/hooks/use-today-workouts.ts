import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog } from '../types'
import { workoutKeys } from './query-keys'

export function useTodayWorkouts() {
  return useQuery({
    queryKey: workoutKeys.today(),
    queryFn: () => apiClient.get<WorkoutLog[]>('/workouts/today').then((r) => r.data),
  })
}
