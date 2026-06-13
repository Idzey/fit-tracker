import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { YoomoneyUrlResponse } from '../types'

export function useYoomoneyUrl() {
  return useMutation({
    mutationFn: () =>
      apiClient
        .post<YoomoneyUrlResponse>('/subscription/yoomoney-url')
        .then((r) => r.data),
  })
}
