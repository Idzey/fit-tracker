import { StyleSheet, View, type ViewStyle } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { Button } from './button'

interface EmptyStateProps {
  title: string
  subtitle?: string
  action?: string
  onAction?: () => void
  style?: ViewStyle
}

export function EmptyState({ title, subtitle, action, onAction, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ThemedText type="default" style={styles.title}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
          {subtitle}
        </ThemedText>
      ) : null}
      {action && onAction ? (
        <Button label={action} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  title: { fontWeight: '600', textAlign: 'center' },
  sub: { textAlign: 'center' },
  btn: { marginTop: 8, paddingHorizontal: 32 },
})
