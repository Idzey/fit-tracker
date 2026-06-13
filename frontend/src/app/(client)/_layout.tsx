import { Redirect, Tabs } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { useRegisterPushToken } from '@/features/notifications/hooks/use-register-push-token'

export default function ClientLayout() {
  const { isAuthenticated, user } = useAuthStore()
  useRegisterPushToken()

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="photos" options={{ title: 'Photos' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
