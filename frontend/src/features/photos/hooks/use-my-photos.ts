import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { Photo } from '../types'
import { photoKeys } from './query-keys'

export function useMyPhotos() {
  return useQuery({
    queryKey: photoKeys.mine(),
    queryFn: () => apiClient.get<Photo[]>('/photos').then((r) => r.data),
  })
}
