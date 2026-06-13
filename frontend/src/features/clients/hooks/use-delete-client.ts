import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import { clientKeys } from './query-keys'
import { subscriptionKeys } from '@/features/subscriptions/hooks/query-keys'

export function useDeleteClient() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) =>
      apiClient.delete(`/trainer/clients/${clientId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all })
      qc.invalidateQueries({ queryKey: subscriptionKeys.mine() })
    },
  })
}
