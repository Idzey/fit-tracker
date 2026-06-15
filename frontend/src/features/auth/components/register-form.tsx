import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Alert, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegister } from '../hooks/use-register'
import { registerSchema, type RegisterData } from '../schemas'

export function RegisterForm() {
  const { mutate: register, isPending } = useRegister()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: RegisterData) => {
    register(data, {
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        Alert.alert('Registration failed', msg ?? 'Please try again.')
      },
    })
  }

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Input
            label="Full name"
            placeholder="Alex Johnson"
            autoComplete="name"
            error={errors.name?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label="Email"
            placeholder="trainer@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            label="Password"
            placeholder="Password"
            secureTextEntry
            autoComplete="new-password"
            error={errors.password?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Button
        label="Create account"
        loading={isPending}
        onPress={handleSubmit(onSubmit)}
        className="mt-2"
      />
    </View>
  )
}
