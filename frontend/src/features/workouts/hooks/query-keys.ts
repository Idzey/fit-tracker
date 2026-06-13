export const workoutKeys = {
  all: ['workouts'] as const,
  today: () => [...workoutKeys.all, 'today'] as const,
  log: (id: string) => [...workoutKeys.all, 'log', id] as const,
  progress: () => [...workoutKeys.all, 'progress'] as const,
  logs: (params?: object) => [...workoutKeys.all, 'logs', params ?? {}] as const,
}
