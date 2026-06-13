import { Alert, Linking, Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useSubscription } from '@/features/subscriptions/hooks/use-subscription'
import { useYoomoneyUrl } from '@/features/subscriptions/hooks/use-yoomoney-url'
import { PLAN_DETAILS, type SubscriptionPlan } from '@/features/subscriptions/types'

function limitLabel(limit: number | null) {
  return limit == null ? 'unlimited' : String(limit)
}

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
    <View className={`bg-card rounded-2xl p-4 gap-1.5 ${current ? 'border-2 border-primary' : ''}`}>
      {current ? (
        <View className="self-start bg-primary/10 rounded-lg px-2 py-0.5 mb-1">
          <Text variant="small" className="text-primary font-semibold">Current plan</Text>
        </View>
      ) : null}
      <Text className="font-bold text-lg text-foreground">{details.label}</Text>
      <Text variant="small" muted>{details.price}</Text>
      <Text variant="small" muted>Up to {limitLabel(details.clientLimit)} clients</Text>
      {!current && plan === 'PRO' ? (
        <Button
          label={loading ? 'Loading...' : `Upgrade to ${details.label}`}
          loading={loading}
          onPress={onUpgrade}
          className="mt-2"
        />
      ) : null}
    </View>
  )
}

export default function SubscriptionScreen() {
  const router = useRouter()
  const { data: sub, isLoading } = useSubscription()
  const { mutate: getUrl, isPending: gettingUrl } = useYoomoneyUrl()

  const handleUpgrade = () => {
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
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between mb-1">
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>Back</Text>
            </Pressable>
            <Text variant="subtitle">Subscription</Text>
            <View style={{ width: 48 }} />
          </View>

          {isLoading ? (
            <View className="gap-3">
              {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </View>
          ) : sub ? (
            <>
              <View className="bg-card rounded-2xl p-4 gap-2.5">
                <View className="flex-row justify-between">
                  <Text muted>Plan</Text>
                  <Text className="font-semibold text-foreground">{PLAN_DETAILS[sub.plan].label}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text muted>Status</Text>
                  <Text className={`font-semibold ${sub.status === 'ACTIVE' ? 'text-success' : 'text-warning'}`}>
                    {sub.status}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text muted>Clients</Text>
                  <Text className="font-semibold text-foreground">
                    {sub.currentClientCount} / {limitLabel(sub.clientLimit)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text muted>Templates</Text>
                  <Text className="font-semibold text-foreground">
                    {sub.currentTemplateCount} / {limitLabel(sub.templateLimit)}
                  </Text>
                </View>
                {periodEnd ? (
                  <View className="flex-row justify-between">
                    <Text muted>Renews</Text>
                    <Text className="font-semibold text-foreground">{periodEnd}</Text>
                  </View>
                ) : null}
              </View>

              <Text className="font-semibold text-base text-foreground">Available plans</Text>
              {(['FREE', 'PRO'] as SubscriptionPlan[]).map((plan) => (
                <PlanCard
                  key={plan}
                  plan={plan}
                  current={sub.plan === plan}
                  onUpgrade={handleUpgrade}
                  loading={gettingUrl}
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

