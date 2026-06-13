import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { PresignUploadResponse } from '../types'

export function usePresignUpload() {
  return useMutation({
    mutationFn: ({ mimeType }: { mimeType: string }) =>
      apiClient
        .post<PresignUploadResponse>('/photos/presign', { mimeType })
        .then((r) => r.data),
  })
}
