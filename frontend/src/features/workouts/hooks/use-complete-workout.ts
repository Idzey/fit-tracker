import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { WorkoutLog } from '../types'
import { workoutMutationKeys } from './mutation-keys'
import { completeWorkoutRequest } from './offline-mutations'
import { workoutKeys } from './query-keys'

export function useCompleteWorkout() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: workoutMutationKeys.completeWorkout(),
    mutationFn: completeWorkoutRequest,
    onMutate: async (logId) => {
      await qc.cancelQueries({ queryKey: workoutKeys.log(logId) })
      const previous = qc.getQueryData<WorkoutLog>(workoutKeys.log(logId))

      qc.setQueryData<WorkoutLog>(workoutKeys.log(logId), (old) => {
        if (!old) return old
        const completedAt = old.completedAt ?? new Date().toISOString()
        return {
          ...old,
          status: 'COMPLETED',
          startedAt: old.startedAt ?? completedAt,
          completedAt,
          exercises: old.exercises.map((exercise) => ({
            ...exercise,
            completedSets: Math.max(exercise.completedSets, exercise.sets),
          })),
        }
      })

      return { previous }
    },
    onError: (_err, logId, ctx) => {
      if (ctx?.previous) qc.setQueryData(workoutKeys.log(logId), ctx.previous)
    },
    onSuccess: (data) => {
      qc.setQueryData(workoutKeys.log(data.id), data)
      qc.invalidateQueries({ queryKey: workoutKeys.today() })
      qc.invalidateQueries({ queryKey: workoutKeys.progress() })
    },
  })
}
