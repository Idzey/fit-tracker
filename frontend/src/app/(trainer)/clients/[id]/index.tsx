import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Avatar } from '@/components/ui/avatar'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useClient } from '@/features/clients/hooks/use-client'
import { useClientPrograms } from '@/features/clients/hooks/use-client-programs'
import { useDeleteClient } from '@/features/clients/hooks/use-delete-client'

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null
  return (
    <View className="flex-row justify-between py-2">
      <Text variant="small" muted className="flex-1">{label}</Text>
      <Text variant="small" className="flex-[2] font-semibold text-right text-foreground">{String(value)}</Text>
    </View>
  )
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: client, isLoading } = useClient(id)
  const { data: programs } = useClientPrograms(id)
  const { mutate: deleteClient } = useDeleteClient()

  const handleDelete = () => {
    Alert.alert('Remove client', `Remove ${client?.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteClient(id, { onSuccess: () => router.replace('/(trainer)/clients/') }),
      },
    ])
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-1">
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>← Back</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </View>
          ) : client ? (
            <>
              <View className="items-center gap-2 py-4">
                <Avatar name={client.name} size="lg" />
                <Text variant="subtitle">{client.name}</Text>
                <Text variant="small" muted>{client.email}</Text>
              </View>

              <View className="bg-card rounded-2xl p-4 gap-1">
                <InfoRow label="Age" value={client.age ? `${client.age} y.o.` : null} />
                <InfoRow label="Weight" value={client.weight ? `${client.weight} kg` : null} />
                <InfoRow label="Height" value={client.height ? `${client.height} cm` : null} />
                {client.goals ? (
                  <View className="pt-2">
                    <Text variant="small" muted>Goals</Text>
                    <Text variant="small" className="mt-1 text-foreground">{client.goals}</Text>
                  </View>
                ) : null}
              </View>

              <View className="gap-3">
                <View className="flex-row justify-between items-center">
                  <Text className="font-semibold text-foreground">Programs</Text>
                  <Pressable
                    onPress={() => router.push(`/(trainer)/clients/${id}/assign`)}
                    hitSlop={8}
                  >
                    <Text variant="small" className="text-primary font-semibold">Assign</Text>
                  </Pressable>
                </View>
                {programs && programs.length > 0 ? (
                  programs.map((p) => (
                    <View key={p.id} className="bg-card rounded-xl p-3 gap-0.5">
                      <Text variant="small" className="font-semibold text-foreground">{p.template.name}</Text>
                      <Text variant="small" muted>
                        From {new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text variant="small" muted>No programs assigned yet</Text>
                )}
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => router.push(`/(trainer)/clients/${id}/progress`)}
                  className="flex-1 bg-primary/10 rounded-xl p-3.5 items-center active:opacity-75"
                >
                  <Text variant="small" className="text-primary font-semibold">📊 Progress</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/(trainer)/clients/${id}/photos`)}
                  className="flex-1 bg-primary/10 rounded-xl p-3.5 items-center active:opacity-75"
                >
                  <Text variant="small" className="text-primary font-semibold">📷 Photos</Text>
                </Pressable>
              </View>

              <Pressable onPress={handleDelete} className="self-center py-3 active:opacity-75">
                <Text variant="small" className="text-destructive">Remove client</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
