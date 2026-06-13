import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { apiClient } from '@/shared/lib/api-client'
import { secureStore } from '@/shared/lib/secure-store'
import { useAuthStore, type AuthUser } from '@/store/auth.store'
import type { RegisterData } from '../schemas'

interface RegisterResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RegisterData) =>
      apiClient.post<RegisterResponse>('/auth/register', data).then((r) => r.data),
    onSuccess: async (data) => {
      await secureStore.setAccessToken(data.accessToken)
      await secureStore.setRefreshToken(data.refreshToken)
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken })
      router.replace('/(trainer)')
    },
  })
}
