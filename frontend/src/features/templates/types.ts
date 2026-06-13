export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number | null
  weight: number | null
  duration: number | null
  notes: string | null
  order: number
}

export interface Day {
  id: string
  dayNumber: number
  name: string
  createdAt: string
  exercises: Exercise[]
}

export interface TemplateSummary {
  id: string
  name: string
  description: string | null
  daysCount: number
  createdAt: string
  updatedAt: string
}

export interface TemplateDetail extends TemplateSummary {
  days: Day[]
}

export interface AssignedProgram {
  id: string
  templateId: string
  clientId: string
  startDate: string
  createdAt: string
  template: { id: string; name: string }
}
