import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { MaxContentWidth, Spacing } from '@/constants/theme'
import { Button } from '@/shared/components/button'
import { useAuthStore } from '@/store/auth.store'
import { secureStore } from '@/shared/lib/secure-store'
import { queryClient } from '@/shared/lib/query-client'
import { useRouter } from 'expo-router'

export default function SettingsScreen() {
  const { logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    logout()
    queryClient.clear()
    await secureStore.clearTokens()
    router.replace('/(auth)/login')
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle">Settings</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Account & preferences
          </ThemedText>
          <Button
            label="Sign out"
            variant="secondary"
            onPress={handleLogout}
            style={styles.logout}
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.two,
  },
  logout: { marginTop: Spacing.five },
})
