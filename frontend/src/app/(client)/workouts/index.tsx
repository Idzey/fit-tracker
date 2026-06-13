import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useWorkoutLogs } from '@/features/workouts/hooks/use-workout-logs'
import type { WorkoutLog, WorkoutStatus } from '@/features/workouts/types'

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
  const statusColor = STATUS_COLOR[log.status] ?? 'text-primary'
  const dotColor = STATUS_DOT_COLOR[log.status] ?? 'bg-primary'
  const done = log.exercises.filter((e) => e.completedSets >= e.sets).length
  const total = log.exercises.length
  const date = log.dueDate ? new Date(log.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null

  return (
    <Pressable onPress={onPress} className="active:opacity-75">
      <View className="bg-card rounded-xl p-3.5 flex-row items-center gap-3">
        <View className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-foreground" numberOfLines={1}>{log.templateName}</Text>
          <Text variant="small" muted>
            Day {log.dayNumber} - {log.dayName}
            {total > 0 ? ` · ${done}/${total} ex` : ''}
            {date ? ` · ${date}` : ''}
          </Text>
        </View>
        <Text className={`text-xs font-semibold ${statusColor}`}>{STATUS_LABEL[log.status]}</Text>
      </View>
    </Pressable>
  )
}

export default function WorkoutsScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<WorkoutStatus | undefined>(undefined)
  const { data: workouts, isLoading } = useWorkoutLogs(filter ? { status: filter } : undefined)

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="subtitle">Workouts</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 py-0.5"
          >
            {FILTERS.map((f) => (
              <Pressable
                key={f.label}
                onPress={() => setFilter(f.value)}
                className={`px-4 py-1.5 rounded-full ${filter === f.value ? 'bg-primary' : 'bg-border'}`}
              >
                <Text
                  variant="small"
                  className={filter === f.value ? 'text-white font-semibold' : 'text-foreground'}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {isLoading ? (
            <View className="gap-2.5">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} className="rounded-xl h-16" />)}
            </View>
          ) : workouts && workouts.length > 0 ? (
            <View className="gap-2.5">
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
              className="mt-4"
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
