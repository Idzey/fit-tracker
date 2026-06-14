import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useTemplate } from '@/features/templates/hooks/use-template'
import { useDeleteTemplate } from '@/features/templates/hooks/use-delete-template'
import type { Day, Exercise } from '@/features/templates/types'
import { getErrorMessage } from '@/shared/lib/error-message'

function ExerciseRow({ ex }: { ex: Exercise }) {
  const meta: string[] = []
  if (ex.reps) meta.push(`${ex.sets}x${ex.reps}`)
  else if (ex.duration) meta.push(`${ex.sets}x${ex.duration}s`)
  else meta.push(`${ex.sets} sets`)
  if (ex.weight) meta.push(`${ex.weight} kg`)

  return (
    <View className="flex-row justify-between py-1.5 gap-2">
      <Text variant="small" className="flex-1 font-medium text-foreground">{ex.name}</Text>
      <Text variant="small" muted>{meta.join(' - ')}</Text>
    </View>
  )
}

function DaySection({ day }: { day: Day }) {
  return (
    <View className="bg-card rounded-2xl p-4 gap-1">
      <View className="mb-2">
        <Text variant="small" className="text-primary font-semibold mb-0.5">Day {day.dayNumber}</Text>
        <Text className="font-semibold text-foreground">{day.name}</Text>
      </View>
      {day.exercises.length > 0 ? (
        day.exercises
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((ex) => <ExerciseRow key={ex.id} ex={ex} />)
      ) : (
        <Text variant="small" muted>No exercises</Text>
      )}
    </View>
  )
}

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: template, isLoading, isError, error, refetch } = useTemplate(id)
  const { mutate: deleteTemplate } = useDeleteTemplate()

  const handleDelete = () => {
    Alert.alert('Delete template', `Delete "${template?.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTemplate(id, { onSuccess: () => router.replace('/(trainer)/templates/') }),
      },
    ])
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-1">
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>Back</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </View>
          ) : isError ? (
            <ErrorState
              message={getErrorMessage(error, 'Could not load template details.')}
              onRetry={() => refetch()}
            />
          ) : template ? (
            <>
              <View className="gap-1.5">
                <Text variant="subtitle">{template.name}</Text>
                {template.description ? (
                  <Text variant="small" muted>{template.description}</Text>
                ) : null}
                <Text variant="small" muted>
                  {template.daysCount} {template.daysCount === 1 ? 'day' : 'days'}
                </Text>
              </View>

              {template.days.length > 0 ? (
                template.days
                  .slice()
                  .sort((a, b) => a.dayNumber - b.dayNumber)
                  .map((day) => <DaySection key={day.id} day={day} />)
              ) : (
                <EmptyState
                  title="No days yet"
                  subtitle="Add training days to this template"
                  action="Add day"
                  onAction={() => router.push(`/(trainer)/templates/${id}/add-day`)}
                />
              )}

              <Pressable
                className="border-[1.5px] border-primary border-dashed rounded-xl h-12 items-center justify-center active:opacity-75"
                onPress={() => router.push(`/(trainer)/templates/${id}/add-day`)}
                accessibilityRole="button"
                accessibilityLabel="Add day to template"
              >
                <Text variant="small" className="text-primary font-semibold">+ Add day</Text>
              </Pressable>

              <Pressable accessibilityRole="button" accessibilityLabel="Delete template" onPress={handleDelete} className="self-center py-3 active:opacity-75">
                <Text variant="small" className="text-destructive">Delete template</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
