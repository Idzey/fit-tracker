import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog } from '@/features/workouts/types'
import { clientKeys } from './query-keys'

interface WorkoutLogsResponse {
  data: WorkoutLog[]
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

export function useClientWorkoutLogs(clientId: string) {
  return useQuery({
    queryKey: clientKeys.workoutLogs(clientId),
    queryFn: () =>
      apiClient
        .get<WorkoutLogsResponse>(`/clients/${clientId}/workout-logs`, { params: { limit: 20 } })
        .then((r) => r.data.data),
    enabled: !!clientId,
  })
}

