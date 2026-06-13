import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Spacing } from '@/constants/theme'
import { Button } from '@/shared/components/button'
import { useAuthStore } from '@/store/auth.store'
import { secureStore } from '@/shared/lib/secure-store'
import { queryClient } from '@/shared/lib/query-client'
import { useMyProgress } from '@/features/workouts/hooks/use-my-progress'

export default function ProfileScreen() {
  const { logout, user } = useAuthStore()
  const router = useRouter()
  const { data: progress } = useMyProgress()

  const handleLogout = async () => {
    logout()
    queryClient.clear()
    await secureStore.clearTokens()
    router.replace('/(auth)/login')
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Profile</ThemedText>

          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {user?.id?.charAt(0)?.toUpperCase() ?? '?'}
              </ThemedText>
            </View>
            <ThemedText type="default" style={styles.userId}>
              Client #{user?.id?.slice(0, 8)}
            </ThemedText>
          </View>

          {progress ? (
            <ThemedView type="backgroundElement" style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <ThemedText style={styles.statVal}>{progress.totalWorkouts}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">Workouts</ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <ThemedText style={styles.statVal}>{progress.streak}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">Day streak</ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <ThemedText style={styles.statVal}>{Math.round(progress.completionRate * 100)}%</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">Completion</ThemedText>
                </View>
              </View>
            </ThemedView>
          ) : null}

          <View style={styles.section}>
            <Pressable onPress={() => router.push('/(client)/notifications')}>
              <ThemedView type="backgroundElement" style={styles.menuRow}>
                <ThemedText type="default">Notifications</ThemedText>
                <ThemedText themeColor="textSecondary">›</ThemedText>
              </ThemedView>
            </Pressable>
          </View>

          <Button
            label="Sign out"
            variant="secondary"
            onPress={handleLogout}
            style={styles.logout}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', gap: 10, paddingVertical: Spacing.two },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#3c87f7', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  userId: { fontWeight: '600', fontSize: 16 },
  statsCard: { borderRadius: 16, padding: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: '700' },
  statDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
  section: { gap: 10 },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  logout: { marginTop: Spacing.two },
})
