import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { NotificationListResponse } from '../types'
import { notificationKeys } from './query-keys'

export function useMarkRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.post(`/notifications/${notificationId}/read`).then((r) => r.data),
    onSuccess: (_data, notificationId) => {
      qc.setQueryData<NotificationListResponse>(notificationKeys.list(), (old) => {
        if (!old) return old
        return {
          items: old.items.map((n) =>
            n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n,
          ),
          unreadCount: Math.max(0, old.unreadCount - 1),
        }
      })
    },
  })
}

