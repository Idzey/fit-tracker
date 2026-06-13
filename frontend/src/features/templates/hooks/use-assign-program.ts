import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import { clientKeys } from '@/features/clients/hooks/query-keys'
import type { AssignedProgram } from '../types'

export interface AssignProgramData {
  templateId: string
  startDate?: string
}

export function useAssignProgram(clientId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: AssignProgramData) =>
      apiClient
        .post<AssignedProgram>(`/trainer/clients/${clientId}/programs`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.detail(clientId) })
      qc.invalidateQueries({ queryKey: clientKeys.programs(clientId) })
      qc.invalidateQueries({ queryKey: clientKeys.list() })
    },
  })
}
