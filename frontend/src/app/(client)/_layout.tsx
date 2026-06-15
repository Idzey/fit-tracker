import { useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { Camera, Dumbbell, Home, TrendingUp, User } from 'lucide-react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAuthStore } from '@/store/auth.store'
import { useRegisterPushToken } from '@/features/notifications/hooks/use-register-push-token'
import {
  DesktopSidebarDock,
  SidebarFloatingButton,
  SidebarOverlay,
  type NavItem,
} from '@/components/ui/sidebar'

const CLIENT_NAV: NavItem[] = [
  { href: '/(client)/', label: 'Главная', icon: Home, exactMatch: true },
  { href: '/(client)/workouts', label: 'Тренировки', icon: Dumbbell },
  { href: '/(client)/progress', label: 'Прогресс', icon: TrendingUp },
  { href: '/(client)/photos', label: 'Фото', icon: Camera },
  { href: '/(client)/profile', label: 'Профиль', icon: User },
]

export default function ClientLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const { width } = useWindowDimensions()
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true)
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false)
  useRegisterPushToken()
  const compactSidebar = width < 768

  if (!isAuthenticated || user?.role !== 'CLIENT') {
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
      <Stack.Screen name="index" options={{ title: 'Главная' }} />
      <Stack.Screen name="workouts" options={{ title: 'Тренировки' }} />
      <Stack.Screen name="progress" options={{ title: 'Прогресс' }} />
      <Stack.Screen name="photos" options={{ title: 'Фото' }} />
      <Stack.Screen name="profile" options={{ title: 'Профиль' }} />
    </Stack>
  )

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 flex-row">
        {!compactSidebar ? (
          <DesktopSidebarDock
            items={CLIENT_NAV}
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
            items={CLIENT_NAV}
            visible={mobileSidebarVisible}
            onClose={() => setMobileSidebarVisible(false)}
          />
        </>
      ) : null}
    </View>
  )
}
