import axios, { create } from 'axios'
import { secureStore } from './secure-store'
import { clearPersistedQueryClient } from './query-persistence'
import { captureException } from './sentry'
import { useAuthStore } from '@/store/auth.store'

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const apiClient = create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
})

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let queue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = []

function flushQueue(error: unknown, token: string | null = null) {
  for (const item of queue) {
    if (error) item.reject(error)
    else item.resolve(token!)
  }
  queue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean }
    const status = error.response?.status

    if (!status || status >= 500) {
      captureException(error, {
        layer: 'api-client',
        method: original?.method,
        url: original?.url,
        status,
      })
    }

    if (status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const { refreshToken, logout, setTokens } = useAuthStore.getState()
    if (!refreshToken) {
      logout()
      await clearPersistedQueryClient()
      await secureStore.clearTokens()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<{
        accessToken: string
        refreshToken: string
      }>(`${API_BASE_URL}/auth/refresh`, { refreshToken })

      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      await secureStore.setAccessToken(data.accessToken)
      await secureStore.setRefreshToken(data.refreshToken)

      flushQueue(null, data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return apiClient(original)
    } catch (refreshError) {
      flushQueue(refreshError)
      logout()
      await clearPersistedQueryClient()
      await secureStore.clearTokens()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
