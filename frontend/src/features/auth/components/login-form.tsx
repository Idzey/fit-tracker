import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Alert, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLogin } from '../hooks/use-login'
import { loginSchema, type LoginData } from '../schemas'

export function LoginForm() {
  const { mutate: login, isPending } = useLogin()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginData) => {
    login(data, {
      onError: () => Alert.alert('Login failed', 'Invalid email or password.'),
    })
  }

  return (
    <View className="gap-4">
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
            autoComplete="current-password"
            error={errors.password?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Button label="Sign in" loading={isPending} onPress={handleSubmit(onSubmit)} className="mt-2" />
    </View>
  )
}
