import { zodResolver } from '@hookform/resolvers/zod'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useTemplate } from '@/features/templates/hooks/use-template'
import { useAddDay } from '@/features/templates/hooks/use-add-day'
import { Spacing } from '@/constants/theme'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'

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
  const { data: template } = useTemplate(id)
  const { mutate: addDay, isPending } = useAddDay(id)

  const nextDayNumber = (template?.days.length ?? 0) + 1

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: `Day ${nextDayNumber}`, exercises: [{ name: '', sets: '3', reps: '', weight: '', notes: '' }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' })

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
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          Alert.alert('Error', msg ?? 'Failed to add day')
        },
      },
    )
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
              </Pressable>
              <ThemedText type="subtitle">Add Day {nextDayNumber}</ThemedText>
              {template ? (
                <ThemedText type="small" themeColor="textSecondary">{template.name}</ThemedText>
              ) : null}
            </View>

            <Controller control={control} name="name" render={({ field }) => (
              <Input label="Day name *" placeholder="Upper Body Push"
                error={errors.name?.message}
                value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
            )} />

            <View style={styles.exercisesSection}>
              <ThemedText type="default" style={styles.sectionTitle}>Exercises</ThemedText>
              {typeof errors.exercises?.message === 'string' ? (
                <ThemedText type="small" style={styles.errorText}>{errors.exercises.message}</ThemedText>
              ) : null}

              {fields.map((field, index) => (
                <ThemedView key={field.id} type="backgroundElement" style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <ThemedText type="small" style={styles.exerciseNum}>#{index + 1}</ThemedText>
                    {fields.length > 1 ? (
                      <Pressable onPress={() => remove(index)} hitSlop={8}>
                        <ThemedText type="small" style={styles.removeText}>Remove</ThemedText>
                      </Pressable>
                    ) : null}
                  </View>

                  <Controller control={control} name={`exercises.${index}.name`} render={({ field: f }) => (
                    <Input label="Exercise name *" placeholder="Bench Press"
                      error={errors.exercises?.[index]?.name?.message}
                      value={f.value} onChangeText={f.onChange} onBlur={f.onBlur} />
                  )} />

                  <View style={styles.metaRow}>
                    <Controller control={control} name={`exercises.${index}.sets`} render={({ field: f }) => (
                      <Input label="Sets *" placeholder="3" keyboardType="number-pad"
                        style={styles.metaInput}
                        error={errors.exercises?.[index]?.sets?.message}
                        value={f.value?.toString()} onChangeText={f.onChange} onBlur={f.onBlur} />
                    )} />
                    <Controller control={control} name={`exercises.${index}.reps`} render={({ field: f }) => (
                      <Input label="Reps" placeholder="10" keyboardType="number-pad"
                        style={styles.metaInput}
                        value={f.value?.toString()} onChangeText={f.onChange} onBlur={f.onBlur} />
                    )} />
                    <Controller control={control} name={`exercises.${index}.weight`} render={({ field: f }) => (
                      <Input label="kg" placeholder="60" keyboardType="decimal-pad"
                        style={styles.metaInput}
                        value={f.value?.toString()} onChangeText={f.onChange} onBlur={f.onBlur} />
                    )} />
                  </View>
                </ThemedView>
              ))}

              <Pressable
                style={styles.addExBtn}
                onPress={() => append({ name: '', sets: '3', reps: '', weight: '', notes: '' })}
              >
                <ThemedText type="small" style={styles.addExText}>+ Add exercise</ThemedText>
              </Pressable>
            </View>

            <Button label="Save day" loading={isPending} onPress={handleSubmit(onSubmit)} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  headerRow: { gap: 4 },
  exercisesSection: { gap: 12 },
  sectionTitle: { fontWeight: '600' },
  errorText: { color: '#e53e3e' },
  exerciseCard: { borderRadius: 14, padding: 14, gap: 12 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseNum: { fontWeight: '700', color: '#3c87f7' },
  removeText: { color: '#e53e3e' },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaInput: { flex: 1 },
  addExBtn: {
    borderWidth: 1.5, borderColor: '#3c87f7', borderStyle: 'dashed',
    borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  addExText: { color: '#3c87f7', fontWeight: '600' },
})
