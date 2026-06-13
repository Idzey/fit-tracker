import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { TemplateDetail } from '../types'
import { templateKeys } from './query-keys'

export interface CreateTemplateData {
  name: string
  description?: string | null
}

export function useCreateTemplate() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTemplateData) =>
      apiClient.post<TemplateDetail>('/workout-templates', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.list() })
    },
  })
}
