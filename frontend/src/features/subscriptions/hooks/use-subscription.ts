import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { Subscription } from '../types'
import { subscriptionKeys } from './query-keys'

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.mine(),
    queryFn: () =>
      apiClient.get<Subscription>('/subscription').then((r) => r.data),
  })
}
