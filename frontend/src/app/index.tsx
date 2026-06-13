import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { apiClient } from '@/shared/lib/api-client'
import { secureStore } from '@/shared/lib/secure-store'
import { useAuthStore, type AuthUser } from '@/store/auth.store'

export default function Index() {
  const [ready, setReady] = useState(false)
  const { isAuthenticated, user, setAuth, logout } = useAuthStore()

  useEffect(() => {
    async function restoreSession() {
      const refreshToken = await secureStore.getRefreshToken()
      if (!refreshToken) {
        setReady(true)
        return
      }

      try {
        const { data } = await apiClient.post<{
          accessToken: string
          refreshToken: string
          user: AuthUser
        }>('/auth/refresh', { refreshToken })

        await secureStore.setAccessToken(data.accessToken)
        await secureStore.setRefreshToken(data.refreshToken)
        setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken })
      } catch {
        logout()
        await secureStore.clearTokens()
      } finally {
        setReady(true)
      }
    }

    restoreSession()
  }, [logout, setAuth])

  if (!ready) return <View className="flex-1 bg-background" />

  if (isAuthenticated) {
    return <Redirect href={user?.role === 'TRAINER' ? '/(trainer)/' : '/(client)/'} />
  }

  return <Redirect href="/(auth)/login" />
}
