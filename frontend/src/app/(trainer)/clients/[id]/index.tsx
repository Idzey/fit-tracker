import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useClient } from '@/features/clients/hooks/use-client'
import { useClientPrograms } from '@/features/clients/hooks/use-client-programs'
import { useDeleteClient } from '@/features/clients/hooks/use-delete-client'
import { Spacing } from '@/constants/theme'
import { SkeletonCard } from '@/shared/components/skeleton'

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null
  return (
    <View style={infoStyles.row}>
      <ThemedText type="small" themeColor="textSecondary" style={infoStyles.label}>{label}</ThemedText>
      <ThemedText type="small" style={infoStyles.value}>{String(value)}</ThemedText>
    </View>
  )
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { flex: 1 },
  value: { flex: 2, fontWeight: '600', textAlign: 'right' },
})

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: client, isLoading } = useClient(id)
  const { data: programs } = useClientPrograms(id)
  const { mutate: deleteClient } = useDeleteClient()

  const handleDelete = () => {
    Alert.alert('Remove client', `Remove ${client?.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteClient(id, { onSuccess: () => router.replace('/(trainer)/clients/') }),
      },
    ])
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.skeletons}>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </View>
          ) : client ? (
            <>
              {/* Header */}
              <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                  <ThemedText style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</ThemedText>
                </View>
                <ThemedText type="subtitle">{client.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{client.email}</ThemedText>
              </View>

              {/* Stats */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <InfoRow label="Age" value={client.age ? `${client.age} y.o.` : null} />
                <InfoRow label="Weight" value={client.weight ? `${client.weight} kg` : null} />
                <InfoRow label="Height" value={client.height ? `${client.height} cm` : null} />
                {client.goals ? (
                  <View style={{ paddingTop: 8 }}>
                    <ThemedText type="small" themeColor="textSecondary">Goals</ThemedText>
                    <ThemedText type="small" style={{ marginTop: 4 }}>{client.goals}</ThemedText>
                  </View>
                ) : null}
              </ThemedView>

              {/* Programs */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="default" style={styles.sectionTitle}>Programs</ThemedText>
                  <Pressable
                    onPress={() => router.push(`/(trainer)/clients/${id}/assign`)}
                    hitSlop={8}
                  >
                    <ThemedText type="small" style={styles.assignBtn}>Assign</ThemedText>
                  </Pressable>
                </View>
                {programs && programs.length > 0 ? (
                  programs.map((p) => (
                    <ThemedView key={p.id} type="backgroundElement" style={styles.programRow}>
                      <ThemedText type="small" style={{ fontWeight: '600' }}>{p.template.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        From {new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </ThemedText>
                    </ThemedView>
                  ))
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">No programs assigned yet</ThemedText>
                )}
              </View>

              {/* Progress & Photos */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => router.push(`/(trainer)/clients/${id}/progress`)}
                  style={[styles.actionBtn, { flex: 1 }]}
                >
                  <ThemedText type="small" style={styles.actionBtnText}>📊 Progress</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/(trainer)/clients/${id}/photos`)}
                  style={[styles.actionBtn, { flex: 1 }]}
                >
                  <ThemedText type="small" style={styles.actionBtnText}>📷 Photos</ThemedText>
                </Pressable>
              </View>

              {/* Danger */}
              <Pressable onPress={handleDelete} style={styles.deleteBtn}>
                <ThemedText type="small" style={styles.deleteText}>Remove client</ThemedText>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  headerRow: { marginBottom: 4 },
  skeletons: { gap: 12 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: Spacing.three },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#3c87f7', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, gap: 4 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: '600' },
  assignBtn: { color: '#3c87f7', fontWeight: '600' },
  programRow: { borderRadius: 12, padding: 12, gap: 2 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    backgroundColor: '#3c87f710', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  actionBtnText: { color: '#3c87f7', fontWeight: '600' },
  deleteBtn: { alignSelf: 'center', paddingVertical: 12 },
  deleteText: { color: '#e53e3e' },
})
