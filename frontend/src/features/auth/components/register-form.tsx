import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Alert, StyleSheet, View } from 'react-native'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { useRegister } from '../hooks/use-register'
import { registerSchema, type RegisterData } from '../schemas'

export function RegisterForm() {
  const { mutate: register, isPending } = useRegister()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = (data: RegisterData) => {
    register(data, {
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        Alert.alert('Registration failed', msg ?? 'Please try again.')
      },
    })
  }

  return (
    <View style={styles.form}>
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
            placeholder="••••••••"
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
        style={styles.submit}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  submit: { marginTop: 8 },
})
