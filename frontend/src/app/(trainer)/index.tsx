import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useAuthStore } from '@/store/auth.store'
import { useClients } from '@/features/clients/hooks/use-clients'
import { useNotifications } from '@/features/notifications/hooks/use-notifications'
import { Spacing } from '@/constants/theme'
import { SkeletonCard } from '@/shared/components/skeleton'

export default function TrainerDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: clientsData, isLoading: loadingClients } = useClients()
  const { data: notifData } = useNotifications()

  const unread = notifData?.unreadCount ?? 0
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="subtitle">{greeting}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Trainer dashboard</ThemedText>
            </View>
            <Pressable
              onPress={() => router.push('/(trainer)/notifications')}
              style={styles.bellBtn}
            >
              <ThemedText style={styles.bellIcon}>🔔</ThemedText>
              {unread > 0 ? (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{unread > 9 ? '9+' : unread}</ThemedText>
                </View>
              ) : null}
            </Pressable>
          </View>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <Pressable
              style={styles.quickCard}
              onPress={() => router.push('/(trainer)/clients/new')}
            >
              <ThemedView type="backgroundElement" style={styles.quickInner}>
                <ThemedText style={styles.quickIcon}>➕</ThemedText>
                <ThemedText type="small" style={styles.quickLabel}>New client</ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable
              style={styles.quickCard}
              onPress={() => router.push('/(trainer)/templates/new')}
            >
              <ThemedView type="backgroundElement" style={styles.quickInner}>
                <ThemedText style={styles.quickIcon}>📋</ThemedText>
                <ThemedText type="small" style={styles.quickLabel}>New template</ThemedText>
              </ThemedView>
            </Pressable>
          </View>

          {/* Recent clients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="default" style={styles.sectionTitle}>Clients</ThemedText>
              <Pressable onPress={() => router.push('/(trainer)/clients')} hitSlop={8}>
                <ThemedText type="small" style={styles.seeAll}>See all</ThemedText>
              </Pressable>
            </View>

            {loadingClients ? (
              <View style={styles.skeletons}>
                {[1, 2, 3].map((i) => <SkeletonCard key={i} style={styles.skCard} />)}
              </View>
            ) : clientsData?.data && clientsData.data.length > 0 ? (
              clientsData.data.slice(0, 5).map((client) => (
                <Pressable
                  key={client.id}
                  onPress={() => router.push(`/(trainer)/clients/${client.id}`)}
                >
                  <ThemedView type="backgroundElement" style={styles.clientRow}>
                    <View style={styles.clientAvatar}>
                      <ThemedText style={styles.clientAvatarText}>
                        {client.name.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.clientInfo}>
                      <ThemedText type="default" style={styles.clientName}>{client.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{client.email}</ThemedText>
                    </View>
                    <ThemedText themeColor="textSecondary">›</ThemedText>
                  </ThemedView>
                </Pressable>
              ))
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No clients yet — add your first one!
              </ThemedText>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bellBtn: { padding: 8, position: 'relative' },
  bellIcon: { fontSize: 24 },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#ef4444', borderRadius: 10,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1 },
  quickInner: { borderRadius: 16, padding: 16, gap: 8, alignItems: 'center' },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontWeight: '600', textAlign: 'center' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: '600', fontSize: 16 },
  seeAll: { color: '#3c87f7', fontWeight: '600' },
  skeletons: { gap: 10 },
  skCard: { borderRadius: 14, height: 64 },
  clientRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 12, gap: 12,
  },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3c87f7', alignItems: 'center', justifyContent: 'center',
  },
  clientAvatarText: { color: '#fff', fontWeight: '700' },
  clientInfo: { flex: 1, gap: 2 },
  clientName: { fontWeight: '600' },
})
