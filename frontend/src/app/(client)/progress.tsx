import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useMyProgress } from '@/features/workouts/hooks/use-my-progress'
import { Spacing } from '@/constants/theme'
import { Skeleton } from '@/shared/components/skeleton'

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.statCard}>
      <ThemedText type="default" style={[styles.statValue, color ? { color } : undefined]}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </ThemedView>
  )
}

function StatCardSkeleton() {
  return (
    <View style={styles.statCard}>
      <Skeleton style={{ height: 32, width: 60, borderRadius: 8, marginBottom: 6 }} />
      <Skeleton style={{ height: 14, width: 80, borderRadius: 6 }} />
    </View>
  )
}

export default function ProgressScreen() {
  const { data: progress, isLoading } = useMyProgress()

  const completionPct = progress ? Math.round(progress.completionRate * 100) : 0
  const lastWorkout = progress?.lastWorkoutAt
    ? new Date(progress.lastWorkoutAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—'

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Progress</ThemedText>

          {isLoading ? (
            <>
              <View style={styles.grid}>
                {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
              </View>
              <Skeleton style={styles.skBar} />
            </>
          ) : progress ? (
            <>
              <View style={styles.grid}>
                <StatCard label="Total workouts" value={progress.totalWorkouts} />
                <StatCard label="This week" value={progress.workoutsThisWeek} color="#3c87f7" />
                <StatCard
                  label="Streak"
                  value={`${progress.streak} day${progress.streak !== 1 ? 's' : ''}`}
                  color="#f59e0b"
                />
                <StatCard label="Last workout" value={lastWorkout} />
              </View>

              <ThemedView type="backgroundElement" style={styles.completionCard}>
                <View style={styles.completionHeader}>
                  <ThemedText type="default" style={styles.completionTitle}>Completion rate</ThemedText>
                  <ThemedText type="default" style={styles.completionPct}>{completionPct}%</ThemedText>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.completionSub}>
                  {completionPct >= 80
                    ? 'Excellent consistency! Keep it up.'
                    : completionPct >= 50
                    ? 'Good work — aim for 80% to see best results.'
                    : 'Stay consistent — every workout counts.'}
                </ThemedText>
              </ThemedView>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '44%',
    borderRadius: 16, padding: 16, gap: 4,
    alignItems: 'flex-start',
  },
  statValue: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  statLabel: { lineHeight: 16 },
  skBar: { height: 120, borderRadius: 16 },
  completionCard: { borderRadius: 16, padding: 16, gap: 12 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionTitle: { fontWeight: '600', fontSize: 16 },
  completionPct: { fontWeight: '700', fontSize: 20, color: '#3c87f7' },
  progressTrack: {
    height: 12, borderRadius: 6,
    backgroundColor: '#e5e7eb', overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#3c87f7', borderRadius: 6 },
  completionSub: { lineHeight: 18 },
})
