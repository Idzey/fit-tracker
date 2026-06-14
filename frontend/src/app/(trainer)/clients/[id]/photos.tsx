import { Dimensions, FlatList, Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useClientPhotos } from '@/features/photos/hooks/use-client-photos'
import type { Photo } from '@/features/photos/types'
import { getErrorMessage } from '@/shared/lib/error-message'

const COLS = 3
const GAP = 3
const SCREEN_W = Dimensions.get('window').width
const TILE = (SCREEN_W - 48 - GAP * (COLS - 1)) / COLS

function PhotoTile({ photo }: { photo: Photo }) {
  const date = new Date(photo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <View>
      <Image
        source={{ uri: photo.thumbnailUrl ?? photo.url }}
        style={{ width: TILE, height: TILE, borderRadius: 6 }}
        contentFit="cover"
        transition={200}
      />
      <Text className="text-[10px] text-muted-foreground text-center mt-0.5">{date}</Text>
    </View>
  )
}

export default function ClientPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: photos, isLoading, isError, error, refetch } = useClientPhotos(id)

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 pt-6 pb-3">
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12}>
            <Text variant="small" muted>Back</Text>
          </Pressable>
          <Text variant="subtitle">Client Photos</Text>
          <View style={{ width: 48 }} />
        </View>

        {isLoading ? (
          <View className="flex-row flex-wrap px-6 gap-[3px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} style={{ width: TILE, height: TILE, borderRadius: 6 }} />
            ))}
          </View>
        ) : isError ? (
          <ErrorState
            message={getErrorMessage(error, 'Could not load client photos.')}
            onRetry={() => refetch()}
            className="m-6"
          />
        ) : photos && photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(p) => p.id}
            numColumns={COLS}
            columnWrapperStyle={{ gap: GAP, marginBottom: GAP + 18 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            renderItem={({ item }) => <PhotoTile photo={item} />}
          />
        ) : (
          <EmptyState
            title="No photos yet"
            subtitle="The client hasn't uploaded any progress photos."
            className="m-6"
          />
        )}
      </SafeAreaView>
    </View>
  )
}
