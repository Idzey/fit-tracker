import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { ClientCard } from '@/features/clients/components/client-card'
import { useClients } from '@/features/clients/hooks/use-clients'
import { useSubscription } from '@/features/subscriptions/hooks/use-subscription'
import { useTheme } from '@/hooks/use-theme'
import { EmptyState } from '@/shared/components/empty-state'
import { SkeletonCard } from '@/shared/components/skeleton'
import { Spacing } from '@/constants/theme'

export default function ClientsScreen() {
  const router = useRouter()
  const theme = useTheme()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useClients(search || undefined)
  const { data: sub } = useSubscription()
  const atLimit = sub != null && sub.currentClientCount >= sub.clientLimit

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Clients</ThemedText>
          {data ? (
            <ThemedText type="small" themeColor="textSecondary">
              {data.pagination.total} total
              {sub ? ` · ${sub.currentClientCount}/${sub.clientLimit}` : ''}
            </ThemedText>
          ) : null}
        </View>

        <View style={[styles.searchWrap, { backgroundColor: theme.backgroundElement }]}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.search, { color: theme.text }]}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        {isLoading ? (
          <View style={styles.skeletons}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} style={styles.skeletonCard} />
            ))}
          </View>
        ) : (
          <FlatList
            data={data?.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ClientCard
                client={item}
                onPress={() => router.push(`/(trainer)/clients/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No clients yet"
                subtitle="Add your first client to get started"
                action="Add client"
                onAction={() => router.push('/(trainer)/clients/new')}
                style={styles.empty}
              />
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable
          style={[styles.fab, atLimit && styles.fabDisabled]}
          onPress={() => router.push('/(trainer)/clients/new')}
        >
          <ThemedText style={styles.fabIcon}>+</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  searchWrap: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },
  search: { fontSize: 15 },
  list: { paddingTop: 4, paddingBottom: 100 },
  skeletons: { paddingHorizontal: Spacing.four, paddingTop: 4, gap: 10 },
  skeletonCard: { borderRadius: 16 },
  empty: { marginTop: Spacing.five },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3c87f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabDisabled: { backgroundColor: '#9ca3af' },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
})
