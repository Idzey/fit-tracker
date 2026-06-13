export interface ClientSummary {
  id: string
  name: string
  avatarKey: string | null
  lastWorkoutAt: string | null
  totalWorkouts: number
  activeProgram: string | null
  activeProgramId: string | null
}

export interface ClientDetail {
  id: string
  userId: string
  email: string
  name: string
  age: number | null
  weight: number | null
  height: number | null
  goals: string | null
  avatarKey: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedClients {
  data: ClientSummary[]
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
}
