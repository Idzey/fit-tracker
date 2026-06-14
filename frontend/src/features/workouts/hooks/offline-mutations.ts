import type { QueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { WorkoutLog } from '../types'
import { workoutMutationKeys } from './mutation-keys'

export interface UpdateExerciseLogVars {
  logId: string
  exerciseLogId: string
  completedSets: number
  actualReps?: number | null
  actualWeight?: number | null
}

let registered = false

export function startWorkoutRequest(logId: string) {
  return apiClient.post<WorkoutLog>(`/workouts/${logId}/start`).then((r) => r.data)
}

export function completeWorkoutRequest(logId: string) {
  return apiClient.post<WorkoutLog>(`/workouts/${logId}/complete`).then((r) => r.data)
}

export function updateExerciseLogRequest({ logId, exerciseLogId, ...body }: UpdateExerciseLogVars) {
  return apiClient
    .put(`/workouts/${logId}/exercises/${exerciseLogId}`, body)
    .then((r) => r.data)
}

export function registerWorkoutMutationDefaults(queryClient: QueryClient) {
  if (registered) return
  registered = true

  queryClient.setMutationDefaults(workoutMutationKeys.startWorkout(), {
    mutationFn: startWorkoutRequest,
    retry: 3,
  })

  queryClient.setMutationDefaults(workoutMutationKeys.updateExerciseLog(), {
    mutationFn: updateExerciseLogRequest,
    retry: 3,
  })

  queryClient.setMutationDefaults(workoutMutationKeys.completeWorkout(), {
    mutationFn: completeWorkoutRequest,
    retry: 3,
  })
}
