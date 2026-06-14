import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { WorkoutLog } from '../types'
import { workoutMutationKeys } from './mutation-keys'
import { startWorkoutRequest } from './offline-mutations'
import { workoutKeys } from './query-keys'

export function useStartWorkout() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: workoutMutationKeys.startWorkout(),
    mutationFn: startWorkoutRequest,
    onMutate: async (logId) => {
      await qc.cancelQueries({ queryKey: workoutKeys.log(logId) })
      const previous = qc.getQueryData<WorkoutLog>(workoutKeys.log(logId))

      qc.setQueryData<WorkoutLog>(workoutKeys.log(logId), (old) => {
        if (!old || old.status !== 'PENDING') return old
        return { ...old, status: 'IN_PROGRESS', startedAt: old.startedAt ?? new Date().toISOString() }
      })

      return { previous }
    },
    onError: (_err, logId, ctx) => {
      if (ctx?.previous) qc.setQueryData(workoutKeys.log(logId), ctx.previous)
    },
    onSuccess: (data) => {
      qc.setQueryData(workoutKeys.log(data.id), data)
      qc.invalidateQueries({ queryKey: workoutKeys.today() })
    },
  })
}
