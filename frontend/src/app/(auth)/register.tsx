import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { RegisterForm } from '@/features/auth/components/register-form'
import { MaxContentWidth, Spacing } from '@/constants/theme'

export default function RegisterScreen() {
  const router = useRouter()

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="subtitle" style={styles.heading}>
              Create account
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
              Start managing your clients with FitTrack
            </ThemedText>

            <RegisterForm />

            <Pressable onPress={() => router.push('/(auth)/login')} style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                Already have an account?{' '}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.link}>
                Sign in
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  heading: { marginBottom: 4 },
  sub: { marginBottom: Spacing.two },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.three,
    flexWrap: 'wrap',
  },
  link: { color: '#3c87f7' },
})
