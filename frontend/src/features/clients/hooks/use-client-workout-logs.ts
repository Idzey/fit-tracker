import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog } from '@/features/workouts/types'
import { clientKeys } from './query-keys'

export function useClientWorkoutLogs(clientId: string) {
  return useQuery({
    queryKey: clientKeys.workoutLogs(clientId),
    queryFn: () =>
      apiClient.get<WorkoutLog[]>(`/clients/${clientId}/workout-logs`).then((r) => r.data),
    enabled: !!clientId,
  })
}
