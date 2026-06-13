import { Pressable, StyleSheet, View } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useTheme } from '@/hooks/use-theme'
import type { ClientSummary } from '../types'

interface ClientCardProps {
  client: ClientSummary
  onPress: () => void
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ClientCard({ client, onPress }: ClientCardProps) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.7 }]}
    >
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.avatar}>
          <ThemedText type="default" style={styles.avatarText}>
            {client.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.info}>
          <ThemedText type="default" style={styles.name}>{client.name}</ThemedText>
          {client.activeProgram ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {client.activeProgram}
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">No program</ThemedText>
          )}
        </View>
        <View style={styles.stats}>
          <ThemedText type="small" style={{ color: '#3c87f7', fontWeight: '600' }}>
            {client.totalWorkouts}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">workouts</ThemedText>
          {client.lastWorkoutAt ? (
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(client.lastWorkoutAt)}
            </ThemedText>
          ) : null}
        </View>
      </ThemedView>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: { marginHorizontal: 16, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  info: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
  stats: { alignItems: 'flex-end', gap: 2 },
})
