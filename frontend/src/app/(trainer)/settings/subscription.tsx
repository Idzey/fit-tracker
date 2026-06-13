import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useSubscription } from '@/features/subscriptions/hooks/use-subscription'
import { useYoomoneyUrl } from '@/features/subscriptions/hooks/use-yoomoney-url'
import { PLAN_DETAILS, type SubscriptionPlan } from '@/features/subscriptions/types'
import { Spacing } from '@/constants/theme'
import { Button } from '@/shared/components/button'
import { SkeletonCard } from '@/shared/components/skeleton'

function PlanCard({
  plan,
  current,
  onUpgrade,
  loading,
}: {
  plan: SubscriptionPlan
  current: boolean
  onUpgrade: () => void
  loading: boolean
}) {
  const details = PLAN_DETAILS[plan]
  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.planCard, current && styles.planCardActive]}
    >
      {current && (
        <View style={styles.currentBadge}>
          <ThemedText style={styles.currentBadgeText}>Current plan</ThemedText>
        </View>
      )}
      <ThemedText type="default" style={styles.planName}>{details.label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{details.price}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Up to {details.clientLimit === 100 ? 'unlimited' : details.clientLimit} clients
      </ThemedText>
      {!current && plan !== 'FREE' ? (
        <Button
          label={loading ? 'Loading…' : `Upgrade to ${details.label}`}
          loading={loading}
          onPress={onUpgrade}
          style={styles.upgradeBtn}
        />
      ) : null}
    </ThemedView>
  )
}

export default function SubscriptionScreen() {
  const router = useRouter()
  const { data: sub, isLoading } = useSubscription()
  const { mutate: getUrl, isPending: gettingUrl } = useYoomoneyUrl()

  const handleUpgrade = (_plan: SubscriptionPlan) => {
    getUrl(undefined, {
      onSuccess: ({ url }) => {
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'Could not open payment page.')
        })
      },
      onError: () => Alert.alert('Error', 'Failed to create checkout session.'),
    })
  }

  const periodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">Subscription</ThemedText>
            <View style={{ width: 48 }} />
          </View>

          {isLoading ? (
            <View style={styles.skeletons}>
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </View>
          ) : sub ? (
            <>
              <ThemedView type="backgroundElement" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <ThemedText type="default" style={styles.summaryLabel}>Plan</ThemedText>
                  <ThemedText type="default" style={styles.summaryValue}>
                    {PLAN_DETAILS[sub.plan].label}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText type="default" style={styles.summaryLabel}>Status</ThemedText>
                  <ThemedText
                    type="default"
                    style={[styles.summaryValue, { color: sub.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }]}
                  >
                    {sub.status}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText type="default" style={styles.summaryLabel}>Clients</ThemedText>
                  <ThemedText type="default" style={styles.summaryValue}>
                    {sub.currentClientCount} / {sub.clientLimit}
                  </ThemedText>
                </View>
                {periodEnd ? (
                  <View style={styles.summaryRow}>
                    <ThemedText type="default" style={styles.summaryLabel}>Renews</ThemedText>
                    <ThemedText type="default" style={styles.summaryValue}>{periodEnd}</ThemedText>
                  </View>
                ) : null}
              </ThemedView>

              <ThemedText type="default" style={styles.plansTitle}>Available plans</ThemedText>
              {(['FREE', 'BASIC', 'PRO'] as SubscriptionPlan[]).map((plan) => (
                <PlanCard
                  key={plan}
                  plan={plan}
                  current={sub.plan === plan}
                  onUpgrade={() => handleUpgrade(plan)}
                  loading={gettingUrl}
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  skeletons: { gap: 12 },
  summaryCard: { borderRadius: 16, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#6b7280' },
  summaryValue: { fontWeight: '600' },
  plansTitle: { fontWeight: '600', fontSize: 16 },
  planCard: { borderRadius: 16, padding: 16, gap: 6 },
  planCardActive: { borderWidth: 2, borderColor: '#3c87f7' },
  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3c87f710',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4,
  },
  currentBadgeText: { color: '#3c87f7', fontSize: 12, fontWeight: '600' },
  planName: { fontWeight: '700', fontSize: 18 },
  upgradeBtn: { marginTop: 8 },
})
