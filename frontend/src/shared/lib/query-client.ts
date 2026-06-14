import NetInfo from '@react-native-community/netinfo'
import { QueryClient, onlineManager } from '@tanstack/react-query'

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false)
  }),
)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7,
      staleTime: 60_000,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: 2,
    },
  },
})
