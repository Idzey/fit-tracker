import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { BackendPhoto, BackendPhotoListResponse, Photo, PhotoUrlResponse } from '../types'
import { photoKeys } from './query-keys'

async function withViewUrl(photo: BackendPhoto): Promise<Photo> {
  const { url } = await apiClient.get<PhotoUrlResponse>(`/photos/${photo.id}/url`).then((r) => r.data)
  return { ...photo, url, thumbnailUrl: url }
}

export function useMyPhotos() {
  return useQuery({
    queryKey: photoKeys.mine(),
    queryFn: async () => {
      const result = await apiClient
        .get<BackendPhotoListResponse>('/photos', { params: { limit: 60 } })
        .then((r) => r.data)

      return Promise.all(result.data.map(withViewUrl))
    },
  })
}

