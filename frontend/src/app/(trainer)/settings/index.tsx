import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { secureStore } from '@/shared/lib/secure-store'
import { queryClient } from '@/shared/lib/query-client'
import { useSubscription } from '@/features/subscriptions/hooks/use-subscription'
import { PLAN_DETAILS } from '@/features/subscriptions/types'

function limitLabel(limit: number | null) {
  return limit == null ? 'unlimited' : String(limit)
}

function SettingsRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} className={onPress ? 'active:opacity-75' : ''}>
      <View className="bg-card rounded-xl px-4 py-3.5 flex-row items-center justify-between">
        <Text className="font-medium text-foreground">{label}</Text>
        <View className="flex-row items-center gap-1.5">
          {value ? <Text variant="small" muted>{value}</Text> : null}
          {onPress ? <Text muted className="text-lg">{'>'}</Text> : null}
        </View>
      </View>
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

  const planLabel = sub
    ? `${PLAN_DETAILS[sub.plan].label} - ${sub.currentClientCount}/${limitLabel(sub.clientLimit)} clients`
    : undefined

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="subtitle">Settings</Text>

          <View className="gap-2.5">
            <Text variant="label" muted className="mb-0.5">ACCOUNT</Text>
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

          <View className="gap-2.5">
            <Text variant="label" muted className="mb-0.5">LEGAL</Text>
            <SettingsRow label="Privacy Policy" />
            <SettingsRow label="Terms of Service" />
          </View>

          <Button label="Sign out" variant="secondary" onPress={handleLogout} className="mt-2" />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

