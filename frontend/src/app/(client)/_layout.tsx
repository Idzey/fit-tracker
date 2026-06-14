import { Platform, View } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { useRegisterPushToken } from '@/features/notifications/hooks/use-register-push-token'
import { AppSidebar, type NavItem } from '@/components/ui/sidebar'

const CLIENT_NAV: NavItem[] = [
  { href: '/(client)/', label: 'Главная', icon: 'home-outline', exactMatch: true },
  { href: '/(client)/workouts', label: 'Тренировки', icon: 'barbell-outline' },
  { href: '/(client)/progress', label: 'Прогресс', icon: 'trending-up-outline' },
  { href: '/(client)/photos', label: 'Фото', icon: 'camera-outline' },
  { href: '/(client)/profile', label: 'Профиль', icon: 'person-circle-outline' },
]

const WEB_TAB_BAR_STYLE = { display: 'none' as const }

export default function ClientLayout() {
  const { isAuthenticated, user } = useAuthStore()
  useRegisterPushToken()

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return <Redirect href="/(auth)/login" />
  }

  const tabs = (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: Platform.OS === 'web' ? WEB_TAB_BAR_STYLE : undefined }}>
      <Tabs.Screen name="index" options={{ title: 'Главная' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Тренировки' }} />
      <Tabs.Screen name="progress" options={{ title: 'Прогресс' }} />
      <Tabs.Screen name="photos" options={{ title: 'Фото' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  )

  return tabs
}
