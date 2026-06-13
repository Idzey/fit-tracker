import { useRouter } from 'expo-router'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { TemplateCard } from '@/features/templates/components/template-card'
import { useTemplates } from '@/features/templates/hooks/use-templates'
import { Spacing } from '@/constants/theme'
import { EmptyState } from '@/shared/components/empty-state'
import { SkeletonCard } from '@/shared/components/skeleton'

export default function TemplatesScreen() {
  const router = useRouter()
  const { data: templates, isLoading } = useTemplates()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Templates</ThemedText>
          {templates ? (
            <ThemedText type="small" themeColor="textSecondary">{templates.length} total</ThemedText>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.skeletons}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} style={styles.skeletonCard} />)}
          </View>
        ) : (
          <FlatList
            data={templates ?? []}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TemplateCard
                template={item}
                onPress={() => router.push(`/(trainer)/templates/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No templates yet"
                subtitle="Create a workout template to assign to clients"
                action="Create template"
                onAction={() => router.push('/(trainer)/templates/new')}
                style={styles.empty}
              />
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable style={styles.fab} onPress={() => router.push('/(trainer)/templates/new')}>
          <ThemedText style={styles.fabIcon}>+</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.two,
  },
  skeletons: { paddingHorizontal: Spacing.four, gap: 10 },
  skeletonCard: { borderRadius: 16 },
  list: { paddingTop: 4, paddingBottom: 100 },
  empty: { marginTop: Spacing.five },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#3c87f7', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3c87f7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
})
