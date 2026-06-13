import { useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
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
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="subtitle">Profile</Text>

          <View className="items-center gap-2.5 py-3">
            <Avatar name={user?.id ?? '?'} size="lg" />
            <Text className="font-semibold text-base text-foreground">
              Client #{user?.id?.slice(0, 8)}
            </Text>
          </View>

          {progress ? (
            <View className="bg-card rounded-2xl p-4">
              <View className="flex-row items-center">
                <View className="flex-1 items-center gap-1">
                  <Text className="text-2xl font-bold text-foreground">{progress.totalWorkouts}</Text>
                  <Text variant="small" muted>Workouts</Text>
                </View>
                <View className="w-px h-10 bg-border" />
                <View className="flex-1 items-center gap-1">
                  <Text className="text-2xl font-bold text-foreground">{progress.streak}</Text>
                  <Text variant="small" muted>Day streak</Text>
                </View>
                <View className="w-px h-10 bg-border" />
                <View className="flex-1 items-center gap-1">
                  <Text className="text-2xl font-bold text-foreground">{Math.round(progress.completionRate * 100)}%</Text>
                  <Text variant="small" muted>Completion</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View className="gap-2.5">
            <Pressable onPress={() => router.push('/(client)/notifications')} className="active:opacity-75">
              <View className="bg-card rounded-xl px-4 py-3.5 flex-row justify-between items-center">
                <Text className="text-foreground">Notifications</Text>
                <Text muted className="text-lg">›</Text>
              </View>
            </Pressable>
          </View>

          <Button
            label="Sign out"
            variant="secondary"
            onPress={handleLogout}
            className="mt-2"
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
