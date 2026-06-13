import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { MaxContentWidth, Spacing } from '@/constants/theme'
import { useAuthStore } from '@/store/auth.store'

export default function TrainerDashboard() {
  const { user } = useAuthStore()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle">Dashboard</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Welcome back, trainer {user?.id.slice(0, 6)}
          </ThemedText>
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
})
