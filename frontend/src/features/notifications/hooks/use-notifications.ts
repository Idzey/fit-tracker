import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { BackendNotificationListResponse, NotificationListResponse } from '../types'
import { notificationKeys } from './query-keys'

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async (): Promise<NotificationListResponse> => {
      const [list, unread] = await Promise.all([
        apiClient
          .get<BackendNotificationListResponse>('/notifications', { params: { limit: 50 } })
          .then((r) => r.data),
        apiClient
          .get<BackendNotificationListResponse>('/notifications', {
            params: { unreadOnly: true, limit: 1 },
          })
          .then((r) => r.data),
      ])

      return {
        items: list.data,
        unreadCount: unread.pagination.total,
      }
    },
    refetchInterval: 30_000,
  })
}

