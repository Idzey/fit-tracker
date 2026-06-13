export const clientKeys = {
  all: ['clients'] as const,
  list: (search?: string) => [...clientKeys.all, 'list', search ?? ''] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  programs: (id: string) => [...clientKeys.all, id, 'programs'] as const,
  workoutLogs: (id: string) => [...clientKeys.all, id, 'workoutLogs'] as const,
  progress: (id: string) => [...clientKeys.all, id, 'progress'] as const,
}
