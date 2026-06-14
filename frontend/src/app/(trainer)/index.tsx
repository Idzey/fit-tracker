import { Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Avatar } from '@/components/ui/avatar'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useClients } from '@/features/clients/hooks/use-clients'
import { useNotifications } from '@/features/notifications/hooks/use-notifications'
import { getErrorMessage } from '@/shared/lib/error-message'

export default function TrainerDashboard() {
  const router = useRouter()
  const {
    data: clientsData,
    isLoading: loadingClients,
    isError: clientsError,
    error: clientsErrorValue,
    refetch: refetchClients,
  } = useClients()
  const { data: notifData } = useNotifications()

  const unread = notifData?.unreadCount ?? 0
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row justify-between items-start">
            <View>
              <Text variant="subtitle">{greeting}</Text>
              <Text variant="small" muted>Trainer dashboard</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              onPress={() => router.push('/(trainer)/notifications')}
              className="p-2 relative"
            >
              <Text className="text-2xl">N</Text>
              {unread > 0 ? (
                <View className="absolute top-1 right-1 bg-destructive rounded-full min-w-[18px] h-[18px] items-center justify-center px-0.5">
                  <Text className="text-white text-[10px] font-bold">{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create new client"
              className="flex-1 active:opacity-75"
              onPress={() => router.push('/(trainer)/clients/new')}
            >
              <View className="bg-card rounded-2xl p-4 gap-2 items-center">
                <Text className="text-3xl">+</Text>
                <Text variant="small" className="font-semibold text-center text-foreground">New client</Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create new workout template"
              className="flex-1 active:opacity-75"
              onPress={() => router.push('/(trainer)/templates/new')}
            >
              <View className="bg-card rounded-2xl p-4 gap-2 items-center">
                <Text className="text-3xl">T</Text>
                <Text variant="small" className="font-semibold text-center text-foreground">New template</Text>
              </View>
            </Pressable>
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-base text-foreground">Clients</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="See all clients" onPress={() => router.push('/(trainer)/clients')} hitSlop={8}>
                <Text variant="small" className="text-primary font-semibold">See all</Text>
              </Pressable>
            </View>

            {loadingClients ? (
              <View className="gap-2.5">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} className="rounded-xl h-16" />)}
              </View>
            ) : clientsError ? (
              <ErrorState
                message={getErrorMessage(clientsErrorValue, 'Could not load clients.')}
                onRetry={() => refetchClients()}
                className="py-8"
              />
            ) : clientsData?.data && clientsData.data.length > 0 ? (
              clientsData.data.slice(0, 5).map((client) => (
                <Pressable
                  key={client.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open client ${client.name}`}
                  onPress={() => router.push(`/(trainer)/clients/${client.id}`)}
                  className="active:opacity-75"
                >
                  <View className="bg-card rounded-xl p-3 flex-row items-center gap-3">
                    <Avatar name={client.name} size="md" />
                    <View className="flex-1 gap-0.5">
                      <Text className="font-semibold text-foreground">{client.name}</Text>
                      <Text variant="small" muted>{client.activeProgram ?? 'No active program'}</Text>
                    </View>
                    <Text muted className="text-lg">{'>'}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <EmptyState
                title="No clients yet"
                subtitle="Add your first client to start assigning programs."
                action="Add client"
                onAction={() => router.push('/(trainer)/clients/new')}
                className="py-8"
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

