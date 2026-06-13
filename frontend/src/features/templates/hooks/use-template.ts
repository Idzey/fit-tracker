import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { TemplateDetail } from '../types'
import { templateKeys } from './query-keys'

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () =>
      apiClient.get<TemplateDetail>(`/workout-templates/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })
}
