import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { useMyProgress } from '@/features/workouts/hooks/use-my-progress'
import { getErrorMessage } from '@/shared/lib/error-message'

function StatCard({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <View className="bg-card rounded-2xl p-4 gap-1 flex-1 min-w-[44%] items-start">
      <Text className={`text-[28px] font-bold leading-9 text-foreground ${className ?? ''}`}>
        {value}
      </Text>
      <Text variant="small" muted>{label}</Text>
    </View>
  )
}

function StatCardSkeleton() {
  return (
    <View className="bg-card rounded-2xl p-4 gap-1 flex-1 min-w-[44%]">
      <Skeleton className="h-8 w-14 mb-1.5" />
      <Skeleton className="h-3.5 w-20" />
    </View>
  )
}

export default function ProgressScreen() {
  const { data: progress, isLoading, isError, error, refetch } = useMyProgress()

  const completionPct = progress ? Math.round(progress.completionRate * 100) : 0
  const lastWorkout = progress?.lastWorkoutAt
    ? new Date(progress.lastWorkoutAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '-'

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="subtitle">Progress</Text>

          {isLoading ? (
            <>
              <View className="flex-row flex-wrap gap-3">
                {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
              </View>
              <Skeleton className="h-28 rounded-2xl" />
            </>
          ) : isError ? (
            <ErrorState
              message={getErrorMessage(error, 'Could not load progress.')}
              onRetry={() => refetch()}
              className="mt-4"
            />
          ) : progress ? (
            <>
              <View className="flex-row flex-wrap gap-3">
                <StatCard label="Total workouts" value={progress.totalWorkouts} />
                <StatCard label="This week" value={progress.workoutsThisWeek} className="text-primary" />
                <StatCard
                  label="Streak"
                  value={`${progress.streak} day${progress.streak !== 1 ? 's' : ''}`}
                  className="text-warning"
                />
                <StatCard label="Last workout" value={lastWorkout} />
              </View>

              <View className="bg-card rounded-2xl p-4 gap-3">
                <View className="flex-row justify-between items-center">
                  <Text className="font-semibold text-base text-foreground">Completion rate</Text>
                  <Text className="font-bold text-xl text-primary">{completionPct}%</Text>
                </View>
                <View className="h-3 rounded-full bg-border overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${completionPct}%` }}
                  />
                </View>
                <Text variant="small" muted className="leading-5">
                  {completionPct >= 80
                    ? 'Excellent consistency! Keep it up.'
                    : completionPct >= 50
                    ? 'Good work - aim for 80% to see best results.'
                    : 'Stay consistent - every workout counts.'}
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
