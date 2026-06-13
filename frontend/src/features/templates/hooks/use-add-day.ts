import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { TemplateDetail } from '../types'
import { templateKeys } from './query-keys'

export interface ExerciseInput {
  name: string
  sets: number
  reps?: number | null
  weight?: number | null
  duration?: number | null
  notes?: string | null
  order: number
}

export interface AddDayData {
  dayNumber: number
  name: string
  exercises: ExerciseInput[]
}

export function useAddDay(templateId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: AddDayData) =>
      apiClient
        .post<TemplateDetail>(`/workout-templates/${templateId}/days`, data)
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(templateKeys.detail(templateId), data)
    },
  })
}
