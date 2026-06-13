import { Pressable, StyleSheet, View } from 'react-native'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import type { TemplateSummary } from '../types'

interface TemplateCardProps {
  template: TemplateSummary
  onPress: () => void
}

export function TemplateCard({ template, onPress }: TemplateCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.7 }]}
    >
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.left}>
          <ThemedText type="default" style={styles.name} numberOfLines={1}>
            {template.name}
          </ThemedText>
          {template.description ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {template.description}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.badge}>
          <ThemedText type="small" style={styles.badgeText}>
            {template.daysCount}d
          </ThemedText>
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
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  left: { flex: 1, gap: 3 },
  name: { fontWeight: '600' },
  badge: {
    backgroundColor: '#3c87f720',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: '#3c87f7', fontWeight: '700' },
})
