import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Button } from '@/shared/components/button'
import { useAuthStore } from '@/store/auth.store'
import { secureStore } from '@/shared/lib/secure-store'
import { queryClient } from '@/shared/lib/query-client'
import { useSubscription } from '@/features/subscriptions/hooks/use-subscription'
import { PLAN_DETAILS } from '@/features/subscriptions/types'
import { Spacing } from '@/constants/theme'

function SettingsRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedText type="default" style={styles.rowLabel}>{label}</ThemedText>
        <View style={styles.rowRight}>
          {value ? <ThemedText type="small" themeColor="textSecondary">{value}</ThemedText> : null}
          {onPress ? <ThemedText themeColor="textSecondary" style={styles.chevron}>›</ThemedText> : null}
        </View>
      </ThemedView>
    </Pressable>
  )
}

export default function SettingsScreen() {
  const { logout } = useAuthStore()
  const router = useRouter()
  const { data: sub } = useSubscription()

  const handleLogout = async () => {
    logout()
    queryClient.clear()
    await secureStore.clearTokens()
    router.replace('/(auth)/login')
  }

  const planLabel = sub ? `${PLAN_DETAILS[sub.plan].label} · ${sub.currentClientCount}/${sub.clientLimit} clients` : undefined

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Settings</ThemedText>

          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>ACCOUNT</ThemedText>
            <SettingsRow
              label="Subscription"
              value={planLabel}
              onPress={() => router.push('/(trainer)/settings/subscription')}
            />
            <SettingsRow
              label="Notifications"
              onPress={() => router.push('/(trainer)/notifications')}
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>LEGAL</ThemedText>
            <SettingsRow label="Privacy Policy" />
            <SettingsRow label="Terms of Service" />
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
  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLabel: { fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chevron: { fontSize: 18 },
  logout: { marginTop: Spacing.two },
})
