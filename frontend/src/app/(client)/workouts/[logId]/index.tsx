import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useWorkoutLog } from '@/features/workouts/hooks/use-workout-log'
import { useStartWorkout } from '@/features/workouts/hooks/use-start-workout'
import { useCompleteWorkout } from '@/features/workouts/hooks/use-complete-workout'
import { useUpdateExerciseLog } from '@/features/workouts/hooks/use-update-exercise-log'
import type { WorkoutExerciseLog } from '@/features/workouts/types'
import { Spacing } from '@/constants/theme'
import { Button } from '@/shared/components/button'
import { SkeletonCard } from '@/shared/components/skeleton'

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
    <ThemedView
      type="backgroundElement"
      style={[styles.exerciseCard, allDone && styles.exerciseDone]}
    >
      <View style={styles.exHeader}>
        <ThemedText type="default" style={[styles.exName, allDone && styles.exNameDone]} numberOfLines={2}>
          {exercise.name}
        </ThemedText>
        {allDone && <ThemedText style={styles.checkmark}>✓</ThemedText>}
      </View>

      <View style={styles.exMeta}>
        {exercise.reps ? (
          <ThemedText type="small" themeColor="textSecondary">{total} × {exercise.reps} reps</ThemedText>
        ) : exercise.duration ? (
          <ThemedText type="small" themeColor="textSecondary">{total} × {exercise.duration}s</ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">{total} sets</ThemedText>
        )}
        {exercise.weight ? (
          <ThemedText type="small" themeColor="textSecondary"> · {exercise.weight} kg</ThemedText>
        ) : null}
      </View>

      <View style={styles.stepper}>
        <Pressable
          onPress={decrement}
          disabled={disabled || done <= 0}
          style={[styles.stepBtn, (disabled || done <= 0) && styles.stepBtnDisabled]}
        >
          <ThemedText style={styles.stepBtnText}>−</ThemedText>
        </Pressable>
        <View style={styles.setsDisplay}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[styles.setDot, i < done ? styles.setDotDone : styles.setDotPending]}
            />
          ))}
        </View>
        <Pressable
          onPress={increment}
          disabled={disabled || allDone}
          style={[styles.stepBtn, styles.stepBtnAdd, (disabled || allDone) && styles.stepBtnDisabled]}
        >
          <ThemedText style={[styles.stepBtnText, { color: '#fff' }]}>+</ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.setsLabel}>
        {done} / {total} sets done
      </ThemedText>
    </ThemedView>
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
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </View>
          ) : log ? (
            <>
              <View style={styles.titleSection}>
                <ThemedText type="subtitle">{log.templateName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Day {log.dayNumber} — {log.dayName}
                </ThemedText>
                {isCompleted ? (
                  <ThemedText type="small" style={styles.completedLabel}>✓ Completed</ThemedText>
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
                  style={[styles.completeBtn, !allExercisesDone && styles.completeBtnDim]}
                />
              ) : null}
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
  titleSection: { gap: 4 },
  completedLabel: { color: '#22c55e', fontWeight: '600' },
  exerciseCard: { borderRadius: 16, padding: 16, gap: 8 },
  exerciseDone: { opacity: 0.7 },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  exName: { flex: 1, fontWeight: '600', fontSize: 16 },
  exNameDone: { textDecorationLine: 'line-through' },
  checkmark: { color: '#22c55e', fontSize: 18, fontWeight: '700' },
  exMeta: { flexDirection: 'row', flexWrap: 'wrap' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3c87f720',
  },
  stepBtnAdd: { backgroundColor: '#3c87f7' },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText: { fontSize: 22, lineHeight: 26, fontWeight: '500', color: '#3c87f7' },
  setsDisplay: { flex: 1, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  setDot: { width: 18, height: 18, borderRadius: 9 },
  setDotDone: { backgroundColor: '#22c55e' },
  setDotPending: { backgroundColor: '#d1d5db' },
  setsLabel: { textAlign: 'right' },
  completeBtn: { marginTop: 8 },
  completeBtnDim: { opacity: 0.75 },
})
