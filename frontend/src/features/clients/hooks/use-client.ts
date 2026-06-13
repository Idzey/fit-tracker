import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { ClientDetail } from '../types'
import { clientKeys } from './query-keys'

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () =>
      apiClient.get<ClientDetail>(`/trainer/clients/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })
}
