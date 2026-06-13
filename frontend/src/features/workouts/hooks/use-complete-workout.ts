import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog } from '../types'
import { workoutKeys } from './query-keys'

export function useCompleteWorkout() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (logId: string) =>
      apiClient.post<WorkoutLog>(`/workouts/${logId}/complete`).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(workoutKeys.log(data.id), data)
      qc.invalidateQueries({ queryKey: workoutKeys.today() })
      qc.invalidateQueries({ queryKey: workoutKeys.progress() })
    },
  })
}
