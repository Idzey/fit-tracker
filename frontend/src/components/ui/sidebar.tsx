import { Pressable, View, ScrollView, useColorScheme } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './text'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

export interface NavItem {
  href: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  exactMatch?: boolean
}

interface AppSidebarProps {
  items: NavItem[]
  appName?: string
}

export function AppSidebar({ items, appName = 'FitTrack' }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const inactiveColor = isDark ? '#a1a9bb' : '#6b7280'
  const activeColor = '#000000'

  function isActive(item: NavItem) {
    if (item.exactMatch) return pathname === item.href
    // home-level items: exact match only
    const depth = item.href.split('/').filter(Boolean).length
    if (depth <= 1) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  return (
    <View
      className="bg-sidebar border-r border-sidebar-border flex-col"
      style={{ width: 240, height: '100%' as any }}
    >
      {/* Header */}
      <View className="px-5 py-5 border-b border-sidebar-border">
        <Text className="text-lg font-bold text-sidebar-foreground tracking-tight">
          {appName}
        </Text>
        {user && (
          <Text className="text-xs text-muted-foreground mt-0.5">
            {user.role === 'TRAINER' ? 'Тренер' : 'Клиент'}
          </Text>
        )}
      </View>

      {/* Nav items */}
      <ScrollView className="flex-1 px-3 py-3" showsVerticalScrollIndicator={false}>
        <View className="gap-0.5">
          {items.map((item) => {
            const active = isActive(item)
            return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href as any)}
                className={cn(
                  'flex-row items-center gap-3 px-3 py-2.5 rounded-lg active:opacity-60',
                  active ? 'bg-sidebar-primary' : '',
                )}
              >
                <Ionicons
                  name={active
                    ? (item.icon.replace('-outline', '') as any)
                    : item.icon}
                  size={18}
                  color={active ? activeColor : inactiveColor}
                />
                <Text
                  className={cn(
                    'text-sm font-medium',
                    active
                      ? 'text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground',
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-3 py-3 border-t border-sidebar-border">
        <Pressable
          className="flex-row items-center gap-3 px-3 py-2.5 rounded-lg active:opacity-60"
          onPress={() => {
            logout()
            router.replace('/(auth)/login')
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={inactiveColor} />
          <Text className="text-sm font-medium text-muted-foreground">Выйти</Text>
        </Pressable>
      </View>
    </View>
  )
}
