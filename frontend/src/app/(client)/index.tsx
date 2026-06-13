import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useTodayWorkouts } from '@/features/workouts/hooks/use-today-workouts'
import { Spacing } from '@/constants/theme'
import { EmptyState } from '@/shared/components/empty-state'
import { SkeletonCard } from '@/shared/components/skeleton'
import type { WorkoutLog } from '@/features/workouts/types'

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: '#22c55e',
  IN_PROGRESS: '#f59e0b',
  PENDING: '#3c87f7',
  SKIPPED: '#6b7280',
}

function WorkoutCard({ log, onPress }: { log: WorkoutLog; onPress: () => void }) {
  const done = log.exercises.filter((e) => e.completedSets >= e.sets).length
  const total = log.exercises.length
  const color = STATUS_COLOR[log.status] ?? '#3c87f7'

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.75 }]}
    >
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={[styles.statusBar, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <ThemedText type="default" style={styles.templateName} numberOfLines={1}>
              {log.templateName}
            </ThemedText>
            <ThemedText type="small" style={[styles.statusLabel, { color }]}>
              {log.status === 'COMPLETED' ? 'Done' : log.status === 'IN_PROGRESS' ? 'Active' : 'Start'}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">Day {log.dayNumber} — {log.dayName}</ThemedText>
          {total > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {done}/{total} exercises
            </ThemedText>
          ) : null}
        </View>
      </ThemedView>
    </Pressable>
  )
}

export default function ClientHome() {
  const router = useRouter()
  const { data: workouts, isLoading } = useTodayWorkouts()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.heading}>Today</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.date}>{today}</ThemedText>

          {isLoading ? (
            <View style={styles.skeletons}>
              {[1, 2].map((i) => <SkeletonCard key={i} style={styles.skeletonCard} />)}
            </View>
          ) : workouts && workouts.length > 0 ? (
            workouts.map((log) => (
              <WorkoutCard
                key={log.id}
                log={log}
                onPress={() => router.push(`/(client)/workouts/${log.id}`)}
              />
            ))
          ) : (
            <EmptyState
              title="Rest day"
              subtitle="No workouts scheduled for today. Great job staying consistent!"
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
  scroll: { padding: Spacing.four, gap: Spacing.two, paddingBottom: 40 },
  heading: { marginBottom: 2 },
  date: { marginBottom: Spacing.three },
  skeletons: { gap: 12 },
  skeletonCard: { borderRadius: 16 },
  empty: { marginTop: Spacing.four },
  cardPressable: {},
  card: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden' },
  statusBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  templateName: { fontWeight: '600', flex: 1 },
  statusLabel: { fontWeight: '600', fontSize: 13 },
})
