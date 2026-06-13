import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useClientWorkoutLogs } from '@/features/clients/hooks/use-client-workout-logs'
import { useClientProgress } from '@/features/clients/hooks/use-client-progress'
import type { WorkoutLog } from '@/features/workouts/types'
import { Spacing } from '@/constants/theme'
import { EmptyState } from '@/shared/components/empty-state'
import { Skeleton, SkeletonCard } from '@/shared/components/skeleton'

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: '#22c55e',
  IN_PROGRESS: '#f59e0b',
  PENDING: '#3c87f7',
  SKIPPED: '#6b7280',
}

function WorkoutRow({ log }: { log: WorkoutLog }) {
  const color = STATUS_COLOR[log.status] ?? '#3c87f7'
  const date = log.completedAt
    ? new Date(log.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : log.dueDate
    ? new Date(log.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const done = log.exercises.filter((e) => e.completedSets >= e.sets).length
  const total = log.exercises.length

  return (
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
      <ThemedText type="small" style={[styles.statusLabel, { color }]}>{log.status}</ThemedText>
    </ThemedView>
  )
}

export default function ClientProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: logs, isLoading: loadingLogs } = useClientWorkoutLogs(id)
  const { data: summary, isLoading: loadingSummary } = useClientProgress(id)

  const isLoading = loadingLogs || loadingSummary

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">Client Progress</ThemedText>
            <View style={{ width: 48 }} />
          </View>

          {isLoading ? (
            <>
              <View style={styles.statsGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.statCard}>
                    <Skeleton style={{ height: 28, width: 50, borderRadius: 6, marginBottom: 6 }} />
                    <Skeleton style={{ height: 14, width: 70, borderRadius: 6 }} />
                  </View>
                ))}
              </View>
              <View style={styles.logList}>
                {[1, 2, 3].map((i) => <SkeletonCard key={i} style={styles.skRow} />)}
              </View>
            </>
          ) : (
            <>
              {summary ? (
                <View style={styles.statsGrid}>
                  <ThemedView type="backgroundElement" style={styles.statCard}>
                    <ThemedText style={styles.statVal}>{summary.totalWorkouts}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Total</ThemedText>
                  </ThemedView>
                  <ThemedView type="backgroundElement" style={styles.statCard}>
                    <ThemedText style={styles.statVal}>{summary.workoutsThisWeek}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">This week</ThemedText>
                  </ThemedView>
                  <ThemedView type="backgroundElement" style={styles.statCard}>
                    <ThemedText style={[styles.statVal, { color: '#f59e0b' }]}>{summary.streak}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Streak</ThemedText>
                  </ThemedView>
                  <ThemedView type="backgroundElement" style={styles.statCard}>
                    <ThemedText style={[styles.statVal, { color: '#22c55e' }]}>
                      {Math.round(summary.completionRate * 100)}%
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Completion</ThemedText>
                  </ThemedView>
                </View>
              ) : null}

              <ThemedText type="default" style={styles.sectionTitle}>Workout history</ThemedText>

              {logs && logs.length > 0 ? (
                <View style={styles.logList}>
                  {logs.map((log) => <WorkoutRow key={log.id} log={log} />)}
                </View>
              ) : (
                <EmptyState
                  title="No workouts yet"
                  subtitle="The client hasn't started any workouts."
                  style={styles.empty}
                />
              )}
            </>
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
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '44%',
    borderRadius: 16, padding: 14, gap: 4,
  },
  statVal: { fontSize: 26, fontWeight: '700' },
  sectionTitle: { fontWeight: '600', fontSize: 16 },
  logList: { gap: 10 },
  skRow: { borderRadius: 14, height: 64 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, gap: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '600' },
  statusLabel: { fontWeight: '600', fontSize: 11 },
  empty: { marginTop: 20 },
})
