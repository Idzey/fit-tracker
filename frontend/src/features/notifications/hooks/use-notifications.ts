import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { NotificationListResponse } from '../types'
import { notificationKeys } from './query-keys'

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () =>
      apiClient.get<NotificationListResponse>('/notifications').then((r) => r.data),
    refetchInterval: 30_000,
  })
}
