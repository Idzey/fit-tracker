import { Platform, Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { ChevronLeft, Dumbbell, LogOut, Menu, type LucideIcon } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Layout,
  SlideInLeft,
  SlideOutLeft,
} from 'react-native-reanimated'
import { Text } from './text'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exactMatch?: boolean
}

interface AppSidebarProps {
  items: NavItem[]
  appName?: string
  onNavigate?: () => void
  onRequestClose?: () => void
}

interface SidebarToggleRailProps {
  onPress: () => void
}

interface DesktopSidebarDockProps {
  items: NavItem[]
  appName?: string
  expanded: boolean
  onToggle: () => void
}

interface SidebarFloatingButtonProps {
  onPress: () => void
}

interface SidebarOverlayProps {
  items: NavItem[]
  visible: boolean
  appName?: string
  onClose: () => void
}

// expo-router route groups like `(client)` are not part of the real URL, so strip
// them before comparing the current pathname with a nav item's href.
function stripGroups(path: string) {
  const cleaned = path
    .replace(/\([^)]*\)/g, '')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '')
  return cleaned === '' ? '/' : cleaned
}

const DESKTOP_DOCK_LAYOUT = Layout.duration(220).easing(Easing.out(Easing.cubic))
const DESKTOP_ENTER = FadeIn.duration(140)
const DESKTOP_EXIT = FadeOut.duration(100)
const OVERLAY_ENTER = FadeIn.duration(160)
const OVERLAY_EXIT = FadeOut.duration(120)
const PANEL_ENTER = SlideInLeft.duration(220).easing(Easing.out(Easing.cubic))
const PANEL_EXIT = SlideOutLeft.duration(180).easing(Easing.in(Easing.cubic))

export function SidebarToggleRail({ onPress }: SidebarToggleRailProps) {
  const isDark = useColorScheme() === 'dark'
  const foregroundColor = isDark ? '#f8fafc' : '#0f172a'

  return (
    <View
      className="bg-sidebar border-r border-sidebar-border items-center self-stretch py-4"
      style={{ width: 64 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open sidebar"
        hitSlop={8}
        onPress={onPress}
        className={cn(
          'h-10 w-10 items-center justify-center rounded-xl',
          Platform.OS === 'web' ? 'hover:bg-sidebar-accent' : 'active:bg-sidebar-accent',
        )}
      >
        <Menu size={20} color={foregroundColor} strokeWidth={2.2} />
      </Pressable>
    </View>
  )
}

export function DesktopSidebarDock({
  items,
  appName = 'FitTrack',
  expanded,
  onToggle,
}: DesktopSidebarDockProps) {
  return (
    <Animated.View
      layout={DESKTOP_DOCK_LAYOUT}
      style={[styles.desktopDock, { width: expanded ? 248 : 64 }]}
    >
      {expanded ? (
        <Animated.View
          entering={DESKTOP_ENTER}
          exiting={DESKTOP_EXIT}
          style={styles.desktopLayer}
        >
          <AppSidebar items={items} appName={appName} onRequestClose={onToggle} />
        </Animated.View>
      ) : (
        <Animated.View
          entering={DESKTOP_ENTER}
          exiting={DESKTOP_EXIT}
          style={[styles.desktopLayer, styles.desktopRailLayer]}
        >
          <SidebarToggleRail onPress={onToggle} />
        </Animated.View>
      )}
    </Animated.View>
  )
}

export function SidebarFloatingButton({ onPress }: SidebarFloatingButtonProps) {
  const isDark = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const foregroundColor = isDark ? '#f8fafc' : '#0f172a'

  return (
    <View pointerEvents="box-none" style={[styles.floatingButton, { bottom: Math.max(insets.bottom + 16, 20) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open sidebar"
        hitSlop={8}
        onPress={onPress}
        className={cn(
          'h-12 w-12 items-center justify-center rounded-xl bg-sidebar border border-sidebar-border',
          Platform.OS === 'web' ? 'hover:bg-sidebar-accent' : 'active:bg-sidebar-accent',
        )}
      >
        <Menu size={22} color={foregroundColor} strokeWidth={2.3} />
      </Pressable>
    </View>
  )
}

export function SidebarOverlay({ items, visible, appName, onClose }: SidebarOverlayProps) {
  const insets = useSafeAreaInsets()

  if (!visible) return null

  return (
    <Animated.View entering={OVERLAY_ENTER} exiting={OVERLAY_EXIT} style={styles.overlayLayer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close sidebar"
        onPress={onClose}
        style={styles.overlayBackdrop}
      >
        <Animated.View pointerEvents="none" style={styles.overlayBackdropShade} />
      </Pressable>
      <Animated.View
        entering={PANEL_ENTER}
        exiting={PANEL_EXIT}
        style={[
          styles.overlaySidebar,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <AppSidebar
          items={items}
          appName={appName}
          onNavigate={onClose}
          onRequestClose={onClose}
        />
      </Animated.View>
    </Animated.View>
  )
}

export function AppSidebar({ items, appName = 'FitTrack', onNavigate, onRequestClose }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const isDark = useColorScheme() === 'dark'

  const current = stripGroups(pathname)
  const activeColor = '#000000'
  const inactiveColor = isDark ? '#9aa3b2' : '#64748b'
  const foregroundColor = isDark ? '#f8fafc' : '#0f172a'
  const roleLabel = user?.role === 'TRAINER' ? 'Тренер' : 'Клиент'

  function isActive(item: NavItem) {
    const target = stripGroups(item.href)
    if (item.exactMatch || target === '/') return current === target
    return current === target || current.startsWith(target + '/')
  }

  return (
    <View
      className="bg-sidebar border-r border-sidebar-border flex-col self-stretch"
      style={{ width: 248, flex: 1 }}
    >
      {/* Brand header */}
      <View className="px-5 py-5 flex-row items-center gap-3 border-b border-sidebar-border">
        <View className="w-9 h-9 rounded-xl bg-primary items-center justify-center">
          <Dumbbell size={20} color={activeColor} strokeWidth={2.4} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-sidebar-foreground tracking-tight" numberOfLines={1}>
            {appName}
          </Text>
          {user ? (
            <Text className="text-xs text-muted-foreground mt-0.5">{roleLabel}</Text>
          ) : null}
        </View>
        {onRequestClose ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hide sidebar"
            hitSlop={8}
            onPress={onRequestClose}
            className={cn(
              'h-9 w-9 items-center justify-center rounded-xl',
              Platform.OS === 'web' ? 'hover:bg-sidebar-accent' : 'active:bg-sidebar-accent',
            )}
          >
            <ChevronLeft size={20} color={foregroundColor} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      {/* Nav items */}
      <ScrollView className="flex-1 px-3 py-4" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          {items.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                onPress={() => {
                  router.push(item.href as never)
                  onNavigate?.()
                }}
                className={cn(
                  'flex-row items-center gap-3 px-3 py-2.5 rounded-xl',
                  active
                    ? 'bg-sidebar-primary'
                    : Platform.OS === 'web'
                      ? 'hover:bg-sidebar-accent'
                      : 'active:bg-sidebar-accent',
                )}
              >
                <Icon
                  size={19}
                  color={active ? activeColor : inactiveColor}
                  strokeWidth={active ? 2.4 : 2}
                />
                <Text
                  className={cn(
                    'text-sm flex-1',
                    active
                      ? 'text-sidebar-primary-foreground font-semibold'
                      : 'text-sidebar-foreground font-medium',
                  )}
                  numberOfLines={1}
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
          accessibilityRole="button"
          accessibilityLabel="Выйти из аккаунта"
          className={cn(
            'flex-row items-center gap-3 px-3 py-2.5 rounded-xl',
            Platform.OS === 'web' ? 'hover:bg-destructive/10' : 'active:bg-destructive/10',
          )}
          onPress={() => {
            onNavigate?.()
            logout()
            router.replace('/(auth)/login')
          }}
        >
          <LogOut size={19} color="#ef4444" strokeWidth={2} />
          <Text className="text-sm font-medium text-destructive">Выйти</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    left: 16,
    zIndex: 900,
    elevation: 900,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  desktopDock: {
    height: '100%',
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  desktopLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  desktopRailLayer: {
    width: 64,
  },
  overlayLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    zIndex: 1000,
    elevation: 1000,
  },
  overlayBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  overlayBackdropShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  overlaySidebar: {
    zIndex: 1,
  },
})
