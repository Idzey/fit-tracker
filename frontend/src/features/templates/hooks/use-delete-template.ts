import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import { templateKeys } from './query-keys'

export function useDeleteTemplate() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/workout-templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.list() })
    },
  })
}
