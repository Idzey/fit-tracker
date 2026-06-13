import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { Photo } from '../types'
import { photoKeys } from './query-keys'

export function useClientPhotos(clientId: string) {
  return useQuery({
    queryKey: photoKeys.client(clientId),
    queryFn: () => apiClient.get<Photo[]>(`/trainer/clients/${clientId}/photos`).then((r) => r.data),
    enabled: !!clientId,
  })
}
