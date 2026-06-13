import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { ProgressSummary } from '@/features/workouts/types'
import { clientKeys } from './query-keys'

export function useClientProgress(clientId: string) {
  return useQuery({
    queryKey: clientKeys.progress(clientId),
    queryFn: () =>
      apiClient.get<ProgressSummary>(`/clients/${clientId}/progress`).then((r) => r.data),
    enabled: !!clientId,
  })
}
