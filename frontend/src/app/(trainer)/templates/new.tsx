import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateTemplate } from '@/features/templates/hooks/use-create-template'

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
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView
            contentContainerClassName="p-6 gap-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-2">
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Text variant="small" muted>← Back</Text>
              </Pressable>
              <Text variant="subtitle">New template</Text>
            </View>

            <View className="gap-4">
              <Controller control={control} name="name" render={({ field }) => (
                <Input label="Template name *" placeholder="Full Body 3x/week"
                  error={errors.name?.message}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />
              <Controller control={control} name="description" render={({ field }) => (
                <Input label="Description" placeholder="Beginner-friendly program…"
                  multiline numberOfLines={3}
                  className="h-22 text-top pt-3"
                  error={errors.description?.message}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />
              <Button label="Create & add days" loading={isPending} onPress={handleSubmit(onSubmit)} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}
