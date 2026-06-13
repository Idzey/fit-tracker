import { Redirect, Tabs } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'

export default function TrainerLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || user?.role !== 'TRAINER') {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
      <Tabs.Screen name="templates" options={{ title: 'Templates', href: null }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
