import { useEffect } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { apiClient } from '@/shared/lib/api-client'

export function useRegisterPushToken() {
  useEffect(() => {
    if (Platform.OS === 'web') return

    const register = async () => {
      const { status: existing } = await Notifications.getPermissionsAsync()
      let finalStatus = existing
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') return

      const tokenData = await Notifications.getExpoPushTokenAsync()
      await apiClient.post('/notifications/push-token', { token: tokenData.data }).catch(() => {})
    }

    register()
  }, [])
}
