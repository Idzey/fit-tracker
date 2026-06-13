import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useTemplates } from '@/features/templates/hooks/use-templates'
import { useAssignProgram } from '@/features/templates/hooks/use-assign-program'
import { Spacing } from '@/constants/theme'
import { EmptyState } from '@/shared/components/empty-state'
import { SkeletonCard } from '@/shared/components/skeleton'

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
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Assign program</ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.skeletons}>
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
                style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.7 }]}
              >
                <ThemedView type="backgroundElement" style={styles.card}>
                  <View style={styles.left}>
                    <ThemedText type="default" style={styles.name}>{item.name}</ThemedText>
                    {item.description ? (
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {item.description}
                      </ThemedText>
                    ) : null}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">{item.daysCount} days</ThemedText>
                </ThemedView>
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
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { padding: Spacing.four, paddingBottom: Spacing.two, gap: 8 },
  skeletons: { paddingHorizontal: Spacing.four, gap: 10 },
  list: { paddingHorizontal: Spacing.four, gap: 10, paddingBottom: 40 },
  pressable: {},
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
  left: { flex: 1, gap: 3 },
  name: { fontWeight: '600' },
})
