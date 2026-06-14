import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorState } from '@/components/ui/error-state'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useCreateClient } from '@/features/clients/hooks/use-create-client'
import { useSubscription } from '@/features/subscriptions/hooks/use-subscription'
import { Paywall } from '@/features/subscriptions/components/paywall'
import { getErrorMessage } from '@/shared/lib/error-message'

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
  const { data: sub, isLoading: loadingSub, isError: subError, error: subErrorValue, refetch: refetchSub } = useSubscription()
  const atLimit = sub != null && sub.clientLimit != null && sub.currentClientCount >= sub.clientLimit

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
          Alert.alert('Error', getErrorMessage(err, 'Failed to create client'))
        },
      },
    )
  }

  if (loadingSub) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="gap-2 px-6 pt-6 mb-2">
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>Back</Text>
            </Pressable>
            <Text variant="subtitle">New client</Text>
          </View>
          <View className="px-6 gap-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </View>
        </SafeAreaView>
      </View>
    )
  }

  if (subError) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="gap-2 px-6 pt-6 mb-2">
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>Back</Text>
            </Pressable>
            <Text variant="subtitle">New client</Text>
          </View>
          <ErrorState
            message={getErrorMessage(subErrorValue, 'Could not check your client limit.')}
            onRetry={() => refetchSub()}
            className="mx-6 mt-6"
          />
        </SafeAreaView>
      </View>
    )
  }

  if (atLimit) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="gap-2 px-6 pt-6 mb-2">
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>Back</Text>
            </Pressable>
            <Text variant="subtitle">New client</Text>
          </View>
          <Paywall
            title={`Client limit reached (${sub.currentClientCount}/${sub.clientLimit})`}
            message="Upgrade your plan to add more clients."
          />
        </SafeAreaView>
      </View>
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
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
                <Text variant="small" muted>Back</Text>
              </Pressable>
              <Text variant="subtitle">New client</Text>
            </View>

            <View className="gap-4">
              <Controller control={control} name="name" render={({ field }) => (
                <Input label="Full name *" placeholder="Alex Johnson" error={errors.name?.message}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />
              <Controller control={control} name="email" render={({ field }) => (
                <Input label="Email *" placeholder="client@example.com" keyboardType="email-address"
                  autoCapitalize="none" error={errors.email?.message}
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />

              <View className="flex-row gap-2.5">
                <Controller control={control} name="age" render={({ field }) => (
                  <Input label="Age" placeholder="28" keyboardType="number-pad"
                    containerClassName="flex-1" error={errors.age?.message}
                    value={field.value?.toString()} onChangeText={field.onChange} onBlur={field.onBlur} />
                )} />
                <Controller control={control} name="weight" render={({ field }) => (
                  <Input label="Weight (kg)" placeholder="75" keyboardType="decimal-pad"
                    containerClassName="flex-1" error={errors.weight?.message}
                    value={field.value?.toString()} onChangeText={field.onChange} onBlur={field.onBlur} />
                )} />
                <Controller control={control} name="height" render={({ field }) => (
                  <Input label="Height (cm)" placeholder="178" keyboardType="decimal-pad"
                    containerClassName="flex-1" error={errors.height?.message}
                    value={field.value?.toString()} onChangeText={field.onChange} onBlur={field.onBlur} />
                )} />
              </View>

              <Controller control={control} name="goals" render={({ field }) => (
                <Input label="Goals" placeholder="Lose 5 kg, build muscle..."
                  multiline numberOfLines={3} error={errors.goals?.message}
                  className="h-22 text-top pt-3"
                  value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )} />

              <Button label="Create client" loading={isPending} onPress={handleSubmit(onSubmit)} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}
