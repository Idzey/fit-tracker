import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { AssignedProgram } from '@/features/templates/types'
import { clientKeys } from './query-keys'

export function useClientPrograms(clientId: string) {
  return useQuery({
    queryKey: clientKeys.programs(clientId),
    queryFn: () =>
      apiClient
        .get<AssignedProgram[]>(`/trainer/clients/${clientId}/programs`)
        .then((r) => r.data),
    enabled: Boolean(clientId),
  })
}
