import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useWorkoutLogs } from '@/features/workouts/hooks/use-workout-logs'
import type { WorkoutLog, WorkoutStatus } from '@/features/workouts/types'
import { Spacing } from '@/constants/theme'
import { EmptyState } from '@/shared/components/empty-state'
import { SkeletonCard } from '@/shared/components/skeleton'

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: '#22c55e',
  IN_PROGRESS: '#f59e0b',
  PENDING: '#3c87f7',
  SKIPPED: '#6b7280',
}

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Done',
  IN_PROGRESS: 'Active',
  PENDING: 'Pending',
  SKIPPED: 'Skipped',
}

const FILTERS: { label: string; value: WorkoutStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'COMPLETED' },
  { label: 'Pending', value: 'PENDING' },
]

function WorkoutRow({ log, onPress }: { log: WorkoutLog; onPress: () => void }) {
  const color = STATUS_COLOR[log.status] ?? '#3c87f7'
  const done = log.exercises.filter((e) => e.completedSets >= e.sets).length
  const total = log.exercises.length
  const date = log.dueDate ? new Date(log.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <View style={styles.rowBody}>
          <ThemedText type="default" style={styles.rowTitle} numberOfLines={1}>{log.templateName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Day {log.dayNumber} — {log.dayName}
            {total > 0 ? ` · ${done}/${total} ex` : ''}
            {date ? ` · ${date}` : ''}
          </ThemedText>
        </View>
        <ThemedText type="small" style={[styles.statusLabel, { color }]}>{STATUS_LABEL[log.status]}</ThemedText>
      </ThemedView>
    </Pressable>
  )
}

export default function WorkoutsScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<WorkoutStatus | undefined>(undefined)
  const { data: workouts, isLoading } = useWorkoutLogs(filter ? { status: filter } : undefined)

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Workouts</ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((f) => (
              <Pressable
                key={f.label}
                onPress={() => setFilter(f.value)}
                style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
              >
                <ThemedText
                  type="small"
                  style={[styles.filterLabel, filter === f.value && styles.filterLabelActive]}
                >
                  {f.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {isLoading ? (
            <View style={styles.skeletons}>
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} style={styles.skRow} />)}
            </View>
          ) : workouts && workouts.length > 0 ? (
            <View style={styles.list}>
              {workouts.map((log) => (
                <WorkoutRow
                  key={log.id}
                  log={log}
                  onPress={() => router.push(`/(client)/workouts/${log.id}`)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No workouts yet"
              subtitle="Your trainer will assign workouts that appear here."
              style={styles.empty}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#3c87f7' },
  filterLabel: { color: '#374151' },
  filterLabelActive: { color: '#fff', fontWeight: '600' },
  skeletons: { gap: 10 },
  skRow: { borderRadius: 14, height: 64 },
  list: { gap: 10 },
  empty: { marginTop: Spacing.four },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, gap: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '600' },
  statusLabel: { fontWeight: '600', fontSize: 12 },
})
