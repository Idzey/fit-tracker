import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Spacing } from '@/constants/theme'

interface PaywallProps {
  title?: string
  message?: string
}

export function Paywall({
  title = 'Plan limit reached',
  message = 'Upgrade your plan to add more clients and unlock all features.',
}: PaywallProps) {
  const router = useRouter()

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText style={styles.icon}>🔒</ThemedText>
      <ThemedText type="default" style={styles.title}>{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>{message}</ThemedText>
      <Pressable
        onPress={() => router.push('/(trainer)/settings/subscription')}
        style={styles.btn}
      >
        <ThemedText style={styles.btnText}>View plans</ThemedText>
      </Pressable>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20, padding: Spacing.four,
    alignItems: 'center', gap: 10,
    margin: Spacing.four,
  },
  icon: { fontSize: 40 },
  title: { fontWeight: '700', fontSize: 18, textAlign: 'center' },
  message: { textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 6, backgroundColor: '#3c87f7',
    borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
