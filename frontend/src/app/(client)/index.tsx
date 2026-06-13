import { useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useTodayWorkouts } from '@/features/workouts/hooks/use-today-workouts'
import type { WorkoutLog } from '@/features/workouts/types'

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'text-success',
  IN_PROGRESS: 'text-warning',
  PENDING: 'text-primary',
  SKIPPED: 'text-muted-foreground',
}

const STATUS_BAR_COLOR: Record<string, string> = {
  COMPLETED: 'bg-success',
  IN_PROGRESS: 'bg-warning',
  PENDING: 'bg-primary',
  SKIPPED: 'bg-muted-foreground',
}

function WorkoutCard({ log, onPress }: { log: WorkoutLog; onPress: () => void }) {
  const done = log.exercises.filter((e) => e.completedSets >= e.sets).length
  const total = log.exercises.length
  const statusColor = STATUS_COLOR[log.status] ?? 'text-primary'
  const barColor = STATUS_BAR_COLOR[log.status] ?? 'bg-primary'

  return (
    <Pressable onPress={onPress} className="active:opacity-75">
      <View className="bg-card rounded-2xl overflow-hidden flex-row">
        <View className={`w-1 ${barColor}`} />
        <View className="flex-1 p-3.5 gap-1">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold flex-1 text-foreground" numberOfLines={1}>
              {log.templateName}
            </Text>
            <Text className={`text-sm font-semibold ${statusColor}`}>
              {log.status === 'COMPLETED' ? 'Done' : log.status === 'IN_PROGRESS' ? 'Active' : 'Start'}
            </Text>
          </View>
          <Text variant="small" muted>Day {log.dayNumber} - {log.dayName}</Text>
          {total > 0 ? (
            <Text variant="small" muted>{done}/{total} exercises</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

export default function ClientHome() {
  const router = useRouter()
  const { data: workouts, isLoading } = useTodayWorkouts()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-3 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="subtitle" className="mb-0.5">Today</Text>
          <Text variant="small" muted className="mb-3">{today}</Text>

          {isLoading ? (
            <View className="gap-3">
              {[1, 2].map((i) => <SkeletonCard key={i} className="rounded-2xl" />)}
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
              className="mt-4"
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
