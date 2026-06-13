import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { PresignUploadPayload, PresignUploadResponse } from '../types'

export function usePresignUpload() {
  return useMutation({
    mutationFn: (payload: PresignUploadPayload) =>
      apiClient.post<PresignUploadResponse>('/uploads/presign', payload).then((r) => r.data),
  })
}

