import { useNetInfo } from '@react-native-community/netinfo'

export function useIsOnline() {
  const netInfo = useNetInfo()

  if (netInfo.isConnected === false) return false
  if (netInfo.isInternetReachable === false) return false

  return true
}
