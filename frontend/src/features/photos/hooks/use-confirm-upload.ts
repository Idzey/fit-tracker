import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { ConfirmUploadPayload, Photo } from '../types'
import { photoKeys } from './query-keys'

export function useConfirmUpload() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: ConfirmUploadPayload) =>
      apiClient.post<Photo>('/photos/confirm', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: photoKeys.mine() })
    },
  })
}
