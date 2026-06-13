import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useNotifications } from '@/features/notifications/hooks/use-notifications'
import { useMarkRead } from '@/features/notifications/hooks/use-mark-read'
import { useMarkAllRead } from '@/features/notifications/hooks/use-mark-all-read'
import type { AppNotification } from '@/features/notifications/types'
import { Spacing } from '@/constants/theme'
import { EmptyState } from '@/shared/components/empty-state'
import { SkeletonCard } from '@/shared/components/skeleton'

function NotificationItem({ item, onRead }: { item: AppNotification; onRead: () => void }) {
  const isUnread = item.readAt === null
  const time = new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Pressable onPress={onRead}>
      <ThemedView type="backgroundElement" style={[styles.item, isUnread && styles.itemUnread]}>
        {isUnread && <View style={styles.unreadDot} />}
        <View style={styles.itemBody}>
          <ThemedText type="default" style={styles.itemTitle}>{item.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{item.body}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.itemTime}>
            {date} · {time}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  )
}

export default function ClientNotificationsScreen() {
  const router = useRouter()
  const { data, isLoading } = useNotifications()
  const { mutate: markRead } = useMarkRead()
  const { mutate: markAll } = useMarkAllRead()

  const unread = data?.unreadCount ?? 0

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Notifications{unread > 0 ? ` (${unread})` : ''}</ThemedText>
          {unread > 0 ? (
            <Pressable onPress={() => markAll()} hitSlop={8}>
              <ThemedText type="small" style={styles.markAllBtn}>Mark all read</ThemedText>
            </Pressable>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.skeletons}>
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </View>
          ) : data && data.items.length > 0 ? (
            data.items.map((n) => (
              <NotificationItem
                key={n.id}
                item={n}
                onRead={() => { if (!n.readAt) markRead(n.id) }}
              />
            ))
          ) : (
            <EmptyState title="All caught up" subtitle="No notifications yet." style={styles.empty} />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  markAllBtn: { color: '#3c87f7', fontWeight: '600' },
  scroll: { padding: Spacing.four, gap: 10, paddingBottom: 40 },
  skeletons: { gap: 10 },
  item: { borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10 },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: '#3c87f7' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#3c87f7', marginTop: 6,
  },
  itemBody: { flex: 1, gap: 3 },
  itemTitle: { fontWeight: '600' },
  itemTime: { fontSize: 11, marginTop: 2 },
  empty: { marginTop: 40 },
})
