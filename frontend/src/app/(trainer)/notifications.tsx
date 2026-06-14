import { Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useNotifications } from '@/features/notifications/hooks/use-notifications'
import { useMarkRead } from '@/features/notifications/hooks/use-mark-read'
import { useMarkAllRead } from '@/features/notifications/hooks/use-mark-all-read'
import type { AppNotification } from '@/features/notifications/types'
import { getErrorMessage } from '@/shared/lib/error-message'

function NotificationItem({ item, onRead }: { item: AppNotification; onRead: () => void }) {
  const isUnread = item.readAt === null
  const time = new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.body}`}
      onPress={onRead}
      className="active:opacity-75"
    >
      <View
        className={`bg-card rounded-xl p-3.5 flex-row gap-2.5 ${isUnread ? 'border-l-[3px] border-primary' : ''}`}
      >
        {isUnread ? <View className="w-2 h-2 rounded-full bg-primary mt-1.5" /> : null}
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-foreground">{item.title}</Text>
          <Text variant="small" muted>{item.body}</Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">{date} - {time}</Text>
        </View>
      </View>
    </Pressable>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch } = useNotifications()
  const { mutate: markRead } = useMarkRead()
  const { mutate: markAll } = useMarkAllRead()

  const unread = data?.unreadCount ?? 0

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 pt-6 pb-3">
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
            <Text variant="small" muted>Back</Text>
          </Pressable>
          <Text variant="subtitle">Notifications{unread > 0 ? ` (${unread})` : ''}</Text>
          {unread > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              onPress={() => markAll()}
              hitSlop={8}
            >
              <Text variant="small" className="text-primary font-semibold">Mark all read</Text>
            </Pressable>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        <ScrollView
          contentContainerClassName="px-6 gap-2.5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View className="gap-2.5">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </View>
          ) : isError ? (
            <ErrorState
              message={getErrorMessage(error, 'Could not load notifications.')}
              onRetry={() => refetch()}
              className="mt-10"
            />
          ) : data && data.items.length > 0 ? (
            data.items.map((n) => (
              <NotificationItem
                key={n.id}
                item={n}
                onRead={() => { if (!n.readAt) markRead(n.id) }}
              />
            ))
          ) : (
            <EmptyState title="All caught up" subtitle="No notifications yet." className="mt-10" />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
