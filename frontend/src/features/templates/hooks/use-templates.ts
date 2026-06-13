import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { TemplateSummary } from '../types'
import { templateKeys } from './query-keys'

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: () =>
      apiClient.get<TemplateSummary[]>('/workout-templates').then((r) => r.data),
  })
}
