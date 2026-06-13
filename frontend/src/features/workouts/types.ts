export type WorkoutStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

export interface WorkoutExerciseLog {
  id: string
  exerciseId: string
  name: string
  sets: number
  reps: number | null
  weight: number | null
  duration: number | null
  targetNotes: string | null
  order: number
  completedSets: number
  actualReps: number | null
  actualWeight: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkoutLog {
  id: string
  assignedProgramId: string
  clientId: string
  status: WorkoutStatus
  dueDate: string
  dayId: string
  dayNumber: number
  dayName: string
  templateId: string
  templateName: string
  templateDescription: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  exercises: WorkoutExerciseLog[]
}

export interface ProgressSummary {
  totalWorkouts: number
  workoutsThisWeek: number
  completionRate: number
  lastWorkoutAt: string | null
  streak: number
}
