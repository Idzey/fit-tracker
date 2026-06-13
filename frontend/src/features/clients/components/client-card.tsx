import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { Avatar } from '@/components/ui/avatar'
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
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-2.5 active:opacity-75"
    >
      <View className="bg-card flex-row items-center p-3.5 rounded-2xl gap-3">
        <Avatar name={client.name} size="md" className="w-11 h-11" />
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-foreground">{client.name}</Text>
          {client.activeProgram ? (
            <Text variant="small" muted numberOfLines={1}>{client.activeProgram}</Text>
          ) : (
            <Text variant="small" muted>No program</Text>
          )}
        </View>
        <View className="items-end gap-0.5">
          <Text variant="small" className="text-primary font-semibold">{client.totalWorkouts}</Text>
          <Text variant="small" muted>workouts</Text>
          {client.lastWorkoutAt ? (
            <Text variant="small" muted>{formatDate(client.lastWorkoutAt)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}
