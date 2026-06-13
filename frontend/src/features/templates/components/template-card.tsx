import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import type { TemplateSummary } from '../types'

interface TemplateCardProps {
  template: TemplateSummary
  onPress: () => void
}

export function TemplateCard({ template, onPress }: TemplateCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-2.5 active:opacity-75"
    >
      <View className="bg-card flex-row items-center p-4 rounded-2xl gap-3">
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-foreground" numberOfLines={1}>
            {template.name}
          </Text>
          {template.description ? (
            <Text variant="small" muted numberOfLines={1}>{template.description}</Text>
          ) : null}
        </View>
        <View className="bg-primary/10 rounded-lg px-2.5 py-1">
          <Text variant="small" className="text-primary font-bold">{template.daysCount}d</Text>
        </View>
      </View>
    </Pressable>
  )
}
