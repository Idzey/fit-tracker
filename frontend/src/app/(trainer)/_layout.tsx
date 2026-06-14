import { Platform, View } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { useRegisterPushToken } from '@/features/notifications/hooks/use-register-push-token'
import { useSse } from '@/features/notifications/hooks/use-sse'
import { AppSidebar, type NavItem } from '@/components/ui/sidebar'

const TRAINER_NAV: NavItem[] = [
  { href: '/(trainer)/', label: 'Дашборд', icon: 'grid-outline', exactMatch: true },
  { href: '/(trainer)/clients', label: 'Клиенты', icon: 'people-outline' },
  { href: '/(trainer)/templates', label: 'Шаблоны', icon: 'document-text-outline' },
  { href: '/(trainer)/notifications', label: 'Уведомления', icon: 'notifications-outline' },
  { href: '/(trainer)/settings', label: 'Настройки', icon: 'settings-outline' },
]

const WEB_TAB_BAR_STYLE = { display: 'none' as const }

export default function TrainerLayout() {
  const { isAuthenticated, user } = useAuthStore()
  useRegisterPushToken()

  if (!isAuthenticated || user?.role !== 'TRAINER') {
    return <Redirect href="/(auth)/login" />
  }

  const tabs = (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: Platform.OS === 'web' ? WEB_TAB_BAR_STYLE : undefined }}>
      <Tabs.Screen name="index" options={{ title: 'Дашборд' }} />
      <Tabs.Screen name="clients" options={{ title: 'Клиенты' }} />
      <Tabs.Screen name="templates" options={{ title: 'Шаблоны' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Уведомления' }} />
      <Tabs.Screen name="settings" options={{ title: 'Настройки' }} />
    </Tabs>
  )

  return tabs
}
