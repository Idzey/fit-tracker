import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useTemplate } from '@/features/templates/hooks/use-template'
import { useDeleteTemplate } from '@/features/templates/hooks/use-delete-template'
import type { Day, Exercise } from '@/features/templates/types'
import { Spacing } from '@/constants/theme'
import { SkeletonCard } from '@/shared/components/skeleton'
import { EmptyState } from '@/shared/components/empty-state'

function ExerciseRow({ ex }: { ex: Exercise }) {
  const meta: string[] = []
  if (ex.reps) meta.push(`${ex.sets}×${ex.reps}`)
  else if (ex.duration) meta.push(`${ex.sets}×${ex.duration}s`)
  else meta.push(`${ex.sets} sets`)
  if (ex.weight) meta.push(`${ex.weight} kg`)

  return (
    <View style={exStyles.row}>
      <ThemedText type="small" style={exStyles.name}>{ex.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{meta.join(' · ')}</ThemedText>
    </View>
  )
}

const exStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 8 },
  name: { flex: 1, fontWeight: '500' },
})

function DaySection({ day, templateId }: { day: Day; templateId: string }) {
  const router = useRouter()
  return (
    <ThemedView type="backgroundElement" style={dayStyles.card}>
      <View style={dayStyles.header}>
        <ThemedText type="small" style={dayStyles.dayLabel}>Day {day.dayNumber}</ThemedText>
        <ThemedText type="default" style={dayStyles.dayName}>{day.name}</ThemedText>
      </View>
      {day.exercises.length > 0 ? (
        day.exercises
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((ex) => <ExerciseRow key={ex.id} ex={ex} />)
      ) : (
        <ThemedText type="small" themeColor="textSecondary">No exercises</ThemedText>
      )}
    </ThemedView>
  )
}

const dayStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 4 },
  header: { marginBottom: 8 },
  dayLabel: { color: '#3c87f7', fontWeight: '600', marginBottom: 2 },
  dayName: { fontWeight: '600' },
})

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: template, isLoading } = useTemplate(id)
  const { mutate: deleteTemplate } = useDeleteTemplate()

  const handleDelete = () => {
    Alert.alert('Delete template', `Delete "${template?.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTemplate(id, { onSuccess: () => router.replace('/(trainer)/templates/') }),
      },
    ])
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.skeletons}>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </View>
          ) : template ? (
            <>
              <View style={styles.titleSection}>
                <ThemedText type="subtitle">{template.name}</ThemedText>
                {template.description ? (
                  <ThemedText type="small" themeColor="textSecondary">{template.description}</ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
                  {template.daysCount} {template.daysCount === 1 ? 'day' : 'days'}
                </ThemedText>
              </View>

              {template.days.length > 0 ? (
                template.days
                  .slice()
                  .sort((a, b) => a.dayNumber - b.dayNumber)
                  .map((day) => <DaySection key={day.id} day={day} templateId={id} />)
              ) : (
                <EmptyState
                  title="No days yet"
                  subtitle="Add training days to this template"
                  action="Add day"
                  onAction={() => router.push(`/(trainer)/templates/${id}/add-day`)}
                />
              )}

              <Pressable
                style={styles.addDayBtn}
                onPress={() => router.push(`/(trainer)/templates/${id}/add-day`)}
              >
                <ThemedText type="small" style={styles.addDayText}>+ Add day</ThemedText>
              </Pressable>

              <Pressable onPress={handleDelete} style={styles.deleteBtn}>
                <ThemedText type="small" style={styles.deleteText}>Delete template</ThemedText>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  headerRow: { marginBottom: 4 },
  skeletons: { gap: 12 },
  titleSection: { gap: 6 },
  addDayBtn: {
    borderWidth: 1.5, borderColor: '#3c87f7', borderStyle: 'dashed',
    borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center',
  },
  addDayText: { color: '#3c87f7', fontWeight: '600' },
  deleteBtn: { alignSelf: 'center', paddingVertical: 12 },
  deleteText: { color: '#e53e3e' },
})
