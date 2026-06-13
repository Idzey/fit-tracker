import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'

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
    <View className="bg-card rounded-3xl p-6 items-center gap-2.5 m-6">
      <Text className="text-5xl">🔒</Text>
      <Text className="font-bold text-lg text-center text-foreground">{title}</Text>
      <Text variant="small" muted className="text-center leading-5">{message}</Text>
      <Pressable
        onPress={() => router.push('/(trainer)/settings/subscription')}
        className="mt-1.5 bg-primary rounded-xl px-6 py-3 active:opacity-75"
      >
        <Text className="text-white font-bold text-base">View plans</Text>
      </Pressable>
    </View>
  )
}
