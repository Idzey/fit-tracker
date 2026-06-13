import { StyleSheet, View, type ViewStyle } from 'react-native'
import { useTheme } from '@/hooks/use-theme'

interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  radius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 20, radius = 10, style }: SkeletonProps) {
  const theme = useTheme()
  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.backgroundElement },
        style,
      ]}
    />
  )
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width={160} height={18} />
      <Skeleton width={100} height={14} style={styles.gap} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { gap: 8, padding: 16 },
  gap: { marginTop: 4 },
})
