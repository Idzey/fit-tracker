import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { BackendSubscription, Subscription } from '../types'
import { subscriptionKeys } from './query-keys'

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.mine(),
    queryFn: async (): Promise<Subscription> => {
      const data = await apiClient.get<BackendSubscription>('/subscription').then((r) => r.data)

      return {
        plan: data.plan,
        status: data.status,
        currentPeriodEnd: data.expiresAt,
        clientLimit: data.clientsLimit,
        currentClientCount: data.clientsUsed,
        templateLimit: data.templatesLimit,
        currentTemplateCount: data.templatesUsed,
        storageMbLimit: data.storageMbLimit,
      }
    },
  })
}

