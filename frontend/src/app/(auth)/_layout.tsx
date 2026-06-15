import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated) {
    return <Redirect href={user?.role === 'TRAINER' ? '/(trainer)' : '/(client)'} />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
