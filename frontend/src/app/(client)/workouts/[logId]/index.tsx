import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useWorkoutLog } from '@/features/workouts/hooks/use-workout-log'
import { useStartWorkout } from '@/features/workouts/hooks/use-start-workout'
import { useCompleteWorkout } from '@/features/workouts/hooks/use-complete-workout'
import { useUpdateExerciseLog } from '@/features/workouts/hooks/use-update-exercise-log'
import type { WorkoutExerciseLog } from '@/features/workouts/types'

function SetStepper({
  exercise,
  logId,
  disabled,
}: {
  exercise: WorkoutExerciseLog
  logId: string
  disabled: boolean
}) {
  const { mutate: updateLog } = useUpdateExerciseLog()
  const done = exercise.completedSets
  const total = exercise.sets
  const allDone = done >= total

  const increment = () => {
    if (done >= total) return
    updateLog({ logId, exerciseLogId: exercise.id, completedSets: done + 1 })
  }

  const decrement = () => {
    if (done <= 0) return
    updateLog({ logId, exerciseLogId: exercise.id, completedSets: done - 1 })
  }

  return (
    <View className={`bg-card rounded-2xl p-4 gap-2 ${allDone ? 'opacity-70' : ''}`}>
      <View className="flex-row justify-between items-start">
        <Text
          className={`flex-1 font-semibold text-base text-foreground ${allDone ? 'line-through' : ''}`}
          numberOfLines={2}
        >
          {exercise.name}
        </Text>
        {allDone && <Text className="text-success text-lg font-bold">✓</Text>}
      </View>

      <View className="flex-row flex-wrap">
        {exercise.reps ? (
          <Text variant="small" muted>{total} × {exercise.reps} reps</Text>
        ) : exercise.duration ? (
          <Text variant="small" muted>{total} × {exercise.duration}s</Text>
        ) : (
          <Text variant="small" muted>{total} sets</Text>
        )}
        {exercise.weight ? (
          <Text variant="small" muted> · {exercise.weight} kg</Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={decrement}
          disabled={disabled || done <= 0}
          className={`w-10 h-10 rounded-xl bg-primary/10 items-center justify-center ${(disabled || done <= 0) ? 'opacity-35' : ''}`}
        >
          <Text className="text-primary text-2xl leading-6 font-medium">−</Text>
        </Pressable>
        <View className="flex-1 flex-row gap-1.5 flex-wrap">
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              className={`w-4.5 h-4.5 rounded-full ${i < done ? 'bg-success' : 'bg-border'}`}
              style={{ width: 18, height: 18 }}
            />
          ))}
        </View>
        <Pressable
          onPress={increment}
          disabled={disabled || allDone}
          className={`w-10 h-10 rounded-xl bg-primary items-center justify-center ${(disabled || allDone) ? 'opacity-35' : ''}`}
        >
          <Text className="text-white text-2xl leading-6 font-medium">+</Text>
        </Pressable>
      </View>
      <Text variant="small" muted className="text-right">{done} / {total} sets done</Text>
    </View>
  )
}

export default function WorkoutExecutionScreen() {
  const { logId } = useLocalSearchParams<{ logId: string }>()
  const router = useRouter()
  const { data: log, isLoading } = useWorkoutLog(logId)
  const { mutate: start } = useStartWorkout()
  const { mutate: complete, isPending: completing } = useCompleteWorkout()

  useEffect(() => {
    if (log?.status === 'PENDING') {
      start(logId)
    }
  }, [log?.status])

  const isCompleted = log?.status === 'COMPLETED'
  const allExercisesDone = log?.exercises.every((e) => e.completedSets >= e.sets) ?? false

  const handleComplete = () => {
    complete(logId, {
      onSuccess: () => {
        Alert.alert('Workout done! 🎉', 'Great job completing your workout!', [
          { text: 'OK', onPress: () => router.replace('/(client)/') },
        ])
      },
      onError: () => Alert.alert('Error', 'Failed to complete workout'),
    })
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-1">
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>← Back</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View className="gap-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </View>
          ) : log ? (
            <>
              <View className="gap-1">
                <Text variant="subtitle">{log.templateName}</Text>
                <Text variant="small" muted>Day {log.dayNumber} — {log.dayName}</Text>
                {isCompleted ? (
                  <Text variant="small" className="text-success font-semibold">✓ Completed</Text>
                ) : null}
              </View>

              {log.exercises
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((ex) => (
                  <SetStepper key={ex.id} exercise={ex} logId={logId} disabled={isCompleted} />
                ))}

              {!isCompleted ? (
                <Button
                  label={allExercisesDone ? 'Complete workout' : `${log.exercises.filter(e => e.completedSets >= e.sets).length}/${log.exercises.length} done — finish early?`}
                  loading={completing}
                  onPress={handleComplete}
                  className={`mt-2 ${!allExercisesDone ? 'opacity-75' : ''}`}
                />
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
