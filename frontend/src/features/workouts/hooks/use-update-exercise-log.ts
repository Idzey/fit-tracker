import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { WorkoutLog } from '../types'
import { workoutMutationKeys } from './mutation-keys'
import { updateExerciseLogRequest } from './offline-mutations'
import { workoutKeys } from './query-keys'

export function useUpdateExerciseLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: workoutMutationKeys.updateExerciseLog(),
    mutationFn: updateExerciseLogRequest,
    onMutate: async ({ logId, exerciseLogId, completedSets }) => {
      await qc.cancelQueries({ queryKey: workoutKeys.log(logId) })
      const previous = qc.getQueryData<WorkoutLog>(workoutKeys.log(logId))

      qc.setQueryData<WorkoutLog>(workoutKeys.log(logId), (old) => {
        if (!old) return old
        return {
          ...old,
          exercises: old.exercises.map((ex) =>
            ex.id === exerciseLogId ? { ...ex, completedSets } : ex,
          ),
        }
      })

      return { previous }
    },
    onError: (_err, { logId }, ctx) => {
      if (ctx?.previous) qc.setQueryData(workoutKeys.log(logId), ctx.previous)
    },
    onSettled: (_data, _err, { logId }) => {
      qc.invalidateQueries({ queryKey: workoutKeys.log(logId) })
      qc.invalidateQueries({ queryKey: workoutKeys.today() })
      qc.invalidateQueries({ queryKey: workoutKeys.progress() })
    },
  })
}
