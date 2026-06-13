import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useCreateClient } from '@/features/clients/hooks/use-create-client'
import { Spacing } from '@/constants/theme'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Enter a valid email'),
  age: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  goals: z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

export default function NewClientScreen() {
  const router = useRouter()
  const { mutate: create, isPending } = useCreateClient()

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    create(
      {
        name: data.name,
        email: data.email,
        age: data.age ? Number(data.age) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        height: data.height ? Number(data.height) : undefined,
        goals: data.goals || undefined,
      },
      {
        onSuccess: (client) => router.replace(`/(trainer)/clients/${client.id}`),
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          Alert.alert('Error', msg ?? 'Failed to create client')
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
              <ThemedText type="subtitle">New client</ThemedText>
            </View>

            <View style={styles.form}>
              <Controller control={control} name="name" render={({ field }) => (
                <Input label="Full name *" placeholder="Alex Johnson" error={errors.name?.message}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />
              <Controller control={control} name="email" render={({ field }) => (
                <Input label="Email *" placeholder="client@example.com" keyboardType="email-address"
                  autoCapitalize="none" error={errors.email?.message}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />

              <View style={styles.row}>
                <Controller control={control} name="age" render={({ field }) => (
                  <Input label="Age" placeholder="28" keyboardType="number-pad"
                    style={styles.rowItem} error={errors.age?.message}
                    value={field.value?.toString()} onChangeText={field.onChange} onBlur={field.onBlur} />
                )} />
                <Controller control={control} name="weight" render={({ field }) => (
                  <Input label="Weight (kg)" placeholder="75" keyboardType="decimal-pad"
                    style={styles.rowItem} error={errors.weight?.message}
                    value={field.value?.toString()} onChangeText={field.onChange} onBlur={field.onBlur} />
                )} />
                <Controller control={control} name="height" render={({ field }) => (
                  <Input label="Height (cm)" placeholder="178" keyboardType="decimal-pad"
                    style={styles.rowItem} error={errors.height?.message}
                    value={field.value?.toString()} onChangeText={field.onChange} onBlur={field.onBlur} />
                )} />
              </View>

              <Controller control={control} name="goals" render={({ field }) => (
                <Input label="Goals" placeholder="Lose 5 kg, build muscle…"
                  multiline numberOfLines={3} error={errors.goals?.message}
                  style={styles.multiline}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />

              <Button label="Create client" loading={isPending} onPress={handleSubmit(onSubmit)} />
            </View>
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
  scroll: { padding: Spacing.four, gap: Spacing.three },
  headerRow: { gap: 8 },
  form: { gap: Spacing.three },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  multiline: { height: 88, textAlignVertical: 'top', paddingTop: 12 },
})
