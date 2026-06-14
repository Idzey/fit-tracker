import '../global.css'
import { Platform, useColorScheme } from 'react-native'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { registerWorkoutMutationDefaults } from '@/features/workouts/hooks/offline-mutations'
import { queryClient } from '@/shared/lib/query-client'
import { queryPersistOptions } from '@/shared/lib/query-persistence'
import { Sentry, captureException } from '@/shared/lib/sentry'

registerWorkoutMutationDefaults(queryClient)

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={queryPersistOptions}
      onSuccess={() => {
        queryClient.resumePausedMutations().catch((error) => {
          captureException(error, { layer: 'query-client', action: 'resume-paused-mutations' })
        })
      }}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </ThemeProvider>
    </PersistQueryClientProvider>
  )
}

export default Sentry.wrap(RootLayout)
