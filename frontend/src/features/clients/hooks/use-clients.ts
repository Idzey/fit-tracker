import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { PaginatedClients } from '../types'
import { clientKeys } from './query-keys'

export function useClients(search?: string) {
  return useQuery({
    queryKey: clientKeys.list(search),
    queryFn: () =>
      apiClient
        .get<PaginatedClients>('/trainer/clients', { params: { search, limit: 50 } })
        .then((r) => r.data),
  })
}
