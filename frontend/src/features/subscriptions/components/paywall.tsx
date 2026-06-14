import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'
import { triggerSelection } from '@/shared/lib/haptics'

interface PaywallProps {
  title?: string
  message?: string
}

export function Paywall({
  title = 'Plan limit reached',
  message = 'Upgrade your plan to add more clients and unlock all features.',
}: PaywallProps) {
  const router = useRouter()

  return (
    <View className="m-6 items-center gap-3 rounded-2xl bg-card p-5">
      <Text className="text-4xl">Lock</Text>
      <Text className="text-center text-lg font-bold text-foreground">{title}</Text>
      <Text variant="small" muted className="text-center leading-5">
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View subscription plans"
        onPress={() => {
          triggerSelection()
          router.push('/(trainer)/settings/subscription')
        }}
        className="mt-1 rounded-xl bg-primary px-6 py-3 active:opacity-75"
      >
        <Text className="font-bold text-white">View plans</Text>
      </Pressable>
    </View>
  )
}

