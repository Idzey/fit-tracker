import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api-client'
import type { ClientDetail } from '../types'
import { clientKeys } from './query-keys'

export interface CreateClientData {
  name: string
  email: string
  age?: number
  weight?: number
  height?: number
  goals?: string
}

export function useCreateClient() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientData) =>
      apiClient.post<ClientDetail>('/trainer/clients', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}
