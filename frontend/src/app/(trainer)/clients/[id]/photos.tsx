import { Dimensions, FlatList, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useClientPhotos } from '@/features/photos/hooks/use-client-photos'
import type { Photo } from '@/features/photos/types'
import { Spacing } from '@/constants/theme'
import { EmptyState } from '@/shared/components/empty-state'
import { Skeleton } from '@/shared/components/skeleton'

const COLS = 3
const GAP = 3
const SCREEN_W = Dimensions.get('window').width
const TILE = (SCREEN_W - Spacing.four * 2 - GAP * (COLS - 1)) / COLS

function PhotoTile({ photo }: { photo: Photo }) {
  const date = new Date(photo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <View>
      <Image
        source={{ uri: photo.thumbnailUrl ?? photo.url }}
        style={styles.tile}
        contentFit="cover"
        transition={200}
      />
      <ThemedText type="small" themeColor="textSecondary" style={styles.tileDate}>{date}</ThemedText>
    </View>
  )
}

export default function ClientPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: photos, isLoading } = useClientPhotos(id)

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Client Photos</ThemedText>
          <View style={{ width: 48 }} />
        </View>

        {isLoading ? (
          <View style={styles.grid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} style={styles.tile} />
            ))}
          </View>
        ) : photos && photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(p) => p.id}
            numColumns={COLS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <PhotoTile photo={item} />}
          />
        ) : (
          <EmptyState
            title="No photos yet"
            subtitle="The client hasn't uploaded any progress photos."
            style={styles.empty}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.four, gap: GAP,
  },
  listContent: { paddingHorizontal: Spacing.four, paddingBottom: 40 },
  row: { gap: GAP, marginBottom: GAP + 18 },
  tile: { width: TILE, height: TILE, borderRadius: 6 },
  tileDate: { textAlign: 'center', marginTop: 2, fontSize: 10 },
  empty: { margin: Spacing.four },
})
