import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useCreateTemplate } from '@/features/templates/hooks/use-create-template'
import { Spacing } from '@/constants/theme'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  description: z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

export default function NewTemplateScreen() {
  const router = useRouter()
  const { mutate: create, isPending } = useCreateTemplate()

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    create(
      { name: data.name, description: data.description || null },
      {
        onSuccess: (template) => router.replace(`/(trainer)/templates/${template.id}`),
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          Alert.alert('Error', msg ?? 'Failed to create template')
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
              <ThemedText type="subtitle">New template</ThemedText>
            </View>

            <View style={styles.form}>
              <Controller control={control} name="name" render={({ field }) => (
                <Input label="Template name *" placeholder="Full Body 3x/week"
                  error={errors.name?.message}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />
              <Controller control={control} name="description" render={({ field }) => (
                <Input label="Description" placeholder="Beginner-friendly program…"
                  multiline numberOfLines={3} style={styles.multiline}
                  error={errors.description?.message}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />
              <Button label="Create & add days" loading={isPending} onPress={handleSubmit(onSubmit)} />
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
  multiline: { height: 88, textAlignVertical: 'top', paddingTop: 12 },
})
