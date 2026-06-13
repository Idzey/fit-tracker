import { Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useClientWorkoutLogs } from '@/features/clients/hooks/use-client-workout-logs'
import { useClientProgress } from '@/features/clients/hooks/use-client-progress'
import type { WorkoutLog } from '@/features/workouts/types'

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'text-success',
  IN_PROGRESS: 'text-warning',
  PENDING: 'text-primary',
  SKIPPED: 'text-muted-foreground',
}

const STATUS_DOT_COLOR: Record<string, string> = {
  COMPLETED: 'bg-success',
  IN_PROGRESS: 'bg-warning',
  PENDING: 'bg-primary',
  SKIPPED: 'bg-muted-foreground',
}

function WorkoutRow({ log }: { log: WorkoutLog }) {
  const statusColor = STATUS_COLOR[log.status] ?? 'text-primary'
  const dotColor = STATUS_DOT_COLOR[log.status] ?? 'bg-primary'
  const date = log.completedAt
    ? new Date(log.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : log.dueDate
    ? new Date(log.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const done = log.exercises.filter((e) => e.completedSets >= e.sets).length
  const total = log.exercises.length

  return (
    <View className="bg-card rounded-xl p-3.5 flex-row items-center gap-3">
      <View className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold text-foreground" numberOfLines={1}>{log.templateName}</Text>
        <Text variant="small" muted>
          Day {log.dayNumber} — {log.dayName}
          {total > 0 ? ` · ${done}/${total} ex` : ''}
          {date ? ` · ${date}` : ''}
        </Text>
      </View>
      <Text className={`text-[11px] font-semibold ${statusColor}`}>{log.status}</Text>
    </View>
  )
}

export default function ClientProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: logs, isLoading: loadingLogs } = useClientWorkoutLogs(id)
  const { data: summary, isLoading: loadingSummary } = useClientProgress(id)

  const isLoading = loadingLogs || loadingSummary

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between mb-1">
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>← Back</Text>
            </Pressable>
            <Text variant="subtitle">Client Progress</Text>
            <View style={{ width: 48 }} />
          </View>

          {isLoading ? (
            <>
              <View className="flex-row flex-wrap gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} className="bg-card rounded-2xl p-3.5 gap-1 flex-1 min-w-[44%]">
                    <Skeleton className="h-7 w-12 mb-1.5" />
                    <Skeleton className="h-3.5 w-16" />
                  </View>
                ))}
              </View>
              <View className="gap-2.5">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} className="rounded-xl h-16" />)}
              </View>
            </>
          ) : (
            <>
              {summary ? (
                <View className="flex-row flex-wrap gap-3">
                  <View className="bg-card rounded-2xl p-3.5 gap-1 flex-1 min-w-[44%]">
                    <Text className="text-[26px] font-bold text-foreground">{summary.totalWorkouts}</Text>
                    <Text variant="small" muted>Total</Text>
                  </View>
                  <View className="bg-card rounded-2xl p-3.5 gap-1 flex-1 min-w-[44%]">
                    <Text className="text-[26px] font-bold text-foreground">{summary.workoutsThisWeek}</Text>
                    <Text variant="small" muted>This week</Text>
                  </View>
                  <View className="bg-card rounded-2xl p-3.5 gap-1 flex-1 min-w-[44%]">
                    <Text className="text-[26px] font-bold text-warning">{summary.streak}</Text>
                    <Text variant="small" muted>Streak</Text>
                  </View>
                  <View className="bg-card rounded-2xl p-3.5 gap-1 flex-1 min-w-[44%]">
                    <Text className="text-[26px] font-bold text-success">
                      {Math.round(summary.completionRate * 100)}%
                    </Text>
                    <Text variant="small" muted>Completion</Text>
                  </View>
                </View>
              ) : null}

              <Text className="font-semibold text-base text-foreground">Workout history</Text>

              {logs && logs.length > 0 ? (
                <View className="gap-2.5">
                  {logs.map((log) => <WorkoutRow key={log.id} log={log} />)}
                </View>
              ) : (
                <EmptyState
                  title="No workouts yet"
                  subtitle="The client hasn't started any workouts."
                  className="mt-5"
                />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
