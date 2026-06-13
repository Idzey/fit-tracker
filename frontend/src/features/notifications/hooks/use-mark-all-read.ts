import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import { notificationKeys } from './query-keys'

export function useMarkAllRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiClient.patch('/notifications/read-all').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list() })
    },
  })
}
