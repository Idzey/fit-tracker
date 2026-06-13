import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, FlatList, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useTemplates } from '@/features/templates/hooks/use-templates'
import { useAssignProgram } from '@/features/templates/hooks/use-assign-program'

export default function AssignProgramScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: templates, isLoading } = useTemplates()
  const { mutate: assign, isPending } = useAssignProgram(id)

  const handleAssign = (templateId: string, templateName: string) => {
    Alert.alert('Assign program', `Assign "${templateName}" starting today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign',
        onPress: () =>
          assign(
            { templateId },
            {
              onSuccess: () => router.back(),
              onError: () => Alert.alert('Error', 'Failed to assign program'),
            },
          ),
      },
    ])
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="p-6 pb-3 gap-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text variant="small" muted>← Back</Text>
          </Pressable>
          <Text variant="subtitle">Assign program</Text>
        </View>

        {isLoading ? (
          <View className="px-6 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </View>
        ) : (
          <FlatList
            data={templates ?? []}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleAssign(item.id, item.name)}
                disabled={isPending}
                className="active:opacity-75 mx-6 mb-2.5"
              >
                <View className="bg-card flex-row items-center p-4 rounded-2xl gap-3">
                  <View className="flex-1 gap-0.5">
                    <Text className="font-semibold text-foreground">{item.name}</Text>
                    {item.description ? (
                      <Text variant="small" muted numberOfLines={1}>{item.description}</Text>
                    ) : null}
                  </View>
                  <Text variant="small" muted>{item.daysCount} days</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <EmptyState
                title="No templates yet"
                subtitle="Create a workout template first"
                action="Go to Templates"
                onAction={() => router.replace('/(trainer)/templates/')}
              />
            }
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
          />
        )}
      </SafeAreaView>
    </View>
  )
}
