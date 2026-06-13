import { useEffect } from 'react'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
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

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      )

      await apiClient
        .post('/devices/token', { token: tokenData.data, platform: Platform.OS })
        .catch(() => {})
    }

    register()
  }, [])
}

