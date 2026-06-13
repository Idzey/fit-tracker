import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ClientCard } from '@/features/clients/components/client-card'
import { useClients } from '@/features/clients/hooks/use-clients'
import { useSubscription } from '@/features/subscriptions/hooks/use-subscription'

function limitLabel(limit: number | null) {
  return limit == null ? 'unlimited' : String(limit)
}

export default function ClientsScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useClients(search || undefined)
  const { data: sub } = useSubscription()
  const atLimit = sub != null && sub.clientLimit != null && sub.currentClientCount >= sub.clientLimit

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row justify-between items-end px-6 pt-4 pb-3">
          <Text variant="subtitle">Clients</Text>
          {data ? (
            <Text variant="small" muted>
              {data.pagination.total} total{sub ? ` - ${sub.currentClientCount}/${limitLabel(sub.clientLimit)}` : ''}
            </Text>
          ) : null}
        </View>

        <View className="mx-6 mb-3 bg-card rounded-xl h-11 justify-center px-3.5">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email..."
            placeholderTextColor="#9ca3af"
            className="text-foreground text-base"
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        {isLoading ? (
          <View className="px-6 pt-1 gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} className="rounded-2xl" />
            ))}
          </View>
        ) : (
          <FlatList
            data={data?.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ClientCard
                client={item}
                onPress={() => router.push(`/(trainer)/clients/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No clients yet"
                subtitle="Add your first client to get started"
                action="Add client"
                onAction={() => router.push('/(trainer)/clients/new')}
                className="mt-10"
              />
            }
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable
          className={`absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center ${atLimit ? 'bg-muted-foreground' : 'bg-primary'}`}
          style={{ shadowColor: '#3c87f7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}
          onPress={() => router.push('/(trainer)/clients/new')}
        >
          <Text className="text-white text-3xl leading-8 font-light">+</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}

