export const workoutMutationKeys = {
  all: ['workouts', 'mutations'] as const,
  startWorkout: () => [...workoutMutationKeys.all, 'start'] as const,
  updateExerciseLog: () => [...workoutMutationKeys.all, 'update-exercise-log'] as const,
  completeWorkout: () => [...workoutMutationKeys.all, 'complete'] as const,
}
