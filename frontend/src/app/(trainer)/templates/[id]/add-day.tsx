import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorState } from '@/components/ui/error-state'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useTemplate } from '@/features/templates/hooks/use-template'
import { useAddDay } from '@/features/templates/hooks/use-add-day'
import { getErrorMessage } from '@/shared/lib/error-message'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Required'),
  sets: z.string().min(1, 'Required'),
  reps: z.string().optional(),
  weight: z.string().optional(),
  notes: z.string().max(200).optional(),
})

const schema = z.object({
  name: z.string().min(1, 'Day name is required'),
  exercises: z.array(exerciseSchema).min(1, 'Add at least one exercise'),
})

type FormData = z.infer<typeof schema>

export default function AddDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: template, isLoading, isError, error, refetch } = useTemplate(id)
  const { mutate: addDay, isPending } = useAddDay(id)

  const nextDayNumber = (template?.days.length ?? 0) + 1

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: `Day ${nextDayNumber}`, exercises: [{ name: '', sets: '3', reps: '', weight: '', notes: '' }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' })

  useEffect(() => {
    setValue('name', `Day ${nextDayNumber}`, { shouldDirty: false, shouldTouch: false })
  }, [nextDayNumber, setValue])

  const onSubmit = (data: FormData) => {
    addDay(
      {
        dayNumber: nextDayNumber,
        name: data.name,
        exercises: data.exercises.map((ex, i) => ({
          name: ex.name,
          sets: Number(ex.sets) || 1,
          reps: ex.reps ? Number(ex.reps) : null,
          weight: ex.weight ? Number(ex.weight) : null,
          notes: ex.notes || null,
          order: i + 1,
        })),
      },
      {
        onSuccess: () => router.back(),
        onError: (err: unknown) => {
          Alert.alert('Error', getErrorMessage(err, 'Failed to add day'))
        },
      },
    )
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView
            contentContainerClassName="p-6 gap-4 pb-10"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-1">
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
                <Text variant="small" muted>Back</Text>
              </Pressable>
              <Text variant="subtitle">Add Day {nextDayNumber}</Text>
              {template ? (
                <Text variant="small" muted>{template.name}</Text>
              ) : null}
            </View>

            {isLoading ? (
              <View className="gap-3">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </View>
            ) : isError ? (
              <ErrorState
                message={getErrorMessage(error, 'Could not load template details.')}
                onRetry={() => refetch()}
              />
            ) : (
              <>
                <Controller control={control} name="name" render={({ field }) => (
                  <Input label="Day name *" placeholder="Upper Body Push"
                    error={errors.name?.message}
                    value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
                )} />

                <View className="gap-3">
                  <Text className="font-semibold text-foreground">Exercises</Text>
                  {typeof errors.exercises?.message === 'string' ? (
                    <Text variant="small" className="text-destructive">{errors.exercises.message}</Text>
                  ) : null}

                  {fields.map((field, index) => (
                    <View key={field.id} className="bg-card rounded-xl p-3.5 gap-3">
                      <View className="flex-row justify-between items-center">
                        <Text variant="small" className="font-bold text-primary">#{index + 1}</Text>
                        {fields.length > 1 ? (
                          <Pressable accessibilityRole="button" accessibilityLabel={`Remove exercise ${index + 1}`} onPress={() => remove(index)} hitSlop={8}>
                            <Text variant="small" className="text-destructive">Remove</Text>
                          </Pressable>
                        ) : null}
                      </View>

                      <Controller control={control} name={`exercises.${index}.name`} render={({ field: f }) => (
                        <Input label="Exercise name *" placeholder="Bench Press"
                          error={errors.exercises?.[index]?.name?.message}
                          value={f.value} onChangeText={f.onChange} onBlur={f.onBlur} />
                      )} />

                      <View className="flex-row gap-2">
                        <Controller control={control} name={`exercises.${index}.sets`} render={({ field: f }) => (
                          <Input label="Sets *" placeholder="3" keyboardType="number-pad"
                            containerClassName="flex-1"
                            error={errors.exercises?.[index]?.sets?.message}
                            value={f.value?.toString()} onChangeText={f.onChange} onBlur={f.onBlur} />
                        )} />
                        <Controller control={control} name={`exercises.${index}.reps`} render={({ field: f }) => (
                          <Input label="Reps" placeholder="10" keyboardType="number-pad"
                            containerClassName="flex-1"
                            value={f.value?.toString()} onChangeText={f.onChange} onBlur={f.onBlur} />
                        )} />
                        <Controller control={control} name={`exercises.${index}.weight`} render={({ field: f }) => (
                          <Input label="kg" placeholder="60" keyboardType="decimal-pad"
                            containerClassName="flex-1"
                            value={f.value?.toString()} onChangeText={f.onChange} onBlur={f.onBlur} />
                        )} />
                      </View>
                    </View>
                  ))}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add exercise"
                    className="border-[1.5px] border-primary border-dashed rounded-xl h-11 items-center justify-center active:opacity-75"
                    onPress={() => append({ name: '', sets: '3', reps: '', weight: '', notes: '' })}
                  >
                    <Text variant="small" className="text-primary font-semibold">+ Add exercise</Text>
                  </Pressable>
                </View>

                <Button label="Save day" loading={isPending} onPress={handleSubmit(onSubmit)} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}
