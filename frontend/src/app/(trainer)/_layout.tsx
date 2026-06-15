import { useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { Bell, FileText, LayoutGrid, Settings, Users } from 'lucide-react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAuthStore } from '@/store/auth.store'
import { useRegisterPushToken } from '@/features/notifications/hooks/use-register-push-token'
import {
  DesktopSidebarDock,
  SidebarFloatingButton,
  SidebarOverlay,
  type NavItem,
} from '@/components/ui/sidebar'

const TRAINER_NAV: NavItem[] = [
  { href: '/(trainer)/', label: 'Дашборд', icon: LayoutGrid, exactMatch: true },
  { href: '/(trainer)/clients', label: 'Клиенты', icon: Users },
  { href: '/(trainer)/templates', label: 'Шаблоны', icon: FileText },
  { href: '/(trainer)/notifications', label: 'Уведомления', icon: Bell },
  { href: '/(trainer)/settings', label: 'Настройки', icon: Settings },
]

export default function TrainerLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const { width } = useWindowDimensions()
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true)
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false)
  useRegisterPushToken()
  const compactSidebar = width < 768

  if (!isAuthenticated || user?.role !== 'TRAINER') {
    return <Redirect href="/(auth)/login" />
  }

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Дашборд' }} />
      <Stack.Screen name="clients" options={{ title: 'Клиенты' }} />
      <Stack.Screen name="templates" options={{ title: 'Шаблоны' }} />
      <Stack.Screen name="notifications" options={{ title: 'Уведомления' }} />
      <Stack.Screen name="settings" options={{ title: 'Настройки' }} />
    </Stack>
  )

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 flex-row">
        {!compactSidebar ? (
          <DesktopSidebarDock
            items={TRAINER_NAV}
            expanded={desktopSidebarVisible}
            onToggle={() => setDesktopSidebarVisible((value) => !value)}
          />
        ) : null}
        <View className="flex-1">{stack}</View>
      </View>

      {compactSidebar ? (
        <>
          {!mobileSidebarVisible ? (
            <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(100)}>
              <SidebarFloatingButton onPress={() => setMobileSidebarVisible(true)} />
            </Animated.View>
          ) : null}
          <SidebarOverlay
            items={TRAINER_NAV}
            visible={mobileSidebarVisible}
            onClose={() => setMobileSidebarVisible(false)}
          />
        </>
      ) : null}
    </View>
  )
}
