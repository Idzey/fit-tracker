import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native'
import { useTheme } from '@/hooks/use-theme'

interface ButtonProps extends PressableProps {
  label: string
  loading?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({ label, loading, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme()
  const isPrimary = variant === 'primary'

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: '#3c87f7' }
          : { backgroundColor: theme.backgroundElement, borderWidth: 0 },
        (pressed || disabled || loading) && styles.dimmed,
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : theme.text} size="small" />
      ) : (
        <Text style={[styles.label, { color: isPrimary ? '#fff' : theme.text }]}>{label}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  dimmed: {
    opacity: 0.6,
  },
})
