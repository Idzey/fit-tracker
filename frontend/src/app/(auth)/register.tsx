import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { RegisterForm } from '@/features/auth/components/register-form'

export default function RegisterScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerClassName="flex-grow justify-center px-6 py-10 gap-3"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text variant="subtitle" className="mb-1">Create account</Text>
            <Text variant="small" muted className="mb-4">Start managing your clients with FitTrack</Text>

            <RegisterForm />

            <Pressable
              onPress={() => router.push('/(auth)/login')}
              className="flex-row justify-center flex-wrap mt-4"
            >
              <Text variant="small" muted>Already have an account? </Text>
              <Text variant="small" className="text-primary font-semibold">Sign in</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}
