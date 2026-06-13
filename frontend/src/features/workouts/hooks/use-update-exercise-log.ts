import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog } from '../types'
import { workoutKeys } from './query-keys'

interface UpdateExerciseLogVars {
  logId: string
  exerciseLogId: string
  completedSets: number
  actualReps?: number | null
  actualWeight?: number | null
}

export function useUpdateExerciseLog() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ logId, exerciseLogId, ...body }: UpdateExerciseLogVars) =>
      apiClient
        .put(`/workouts/${logId}/exercises/${exerciseLogId}`, body)
        .then((r) => r.data),
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
    },
  })
}
