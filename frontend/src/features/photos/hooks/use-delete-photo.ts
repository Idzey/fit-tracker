import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import { photoKeys } from './query-keys'

export function useDeletePhoto() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (photoId: string) =>
      apiClient.delete(`/photos/${photoId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: photoKeys.mine() })
    },
  })
}
