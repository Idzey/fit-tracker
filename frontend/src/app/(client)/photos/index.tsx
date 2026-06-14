import { Alert, Dimensions, FlatList, Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useMyPhotos } from '@/features/photos/hooks/use-my-photos'
import { useDeletePhoto } from '@/features/photos/hooks/use-delete-photo'
import type { Photo } from '@/features/photos/types'
import { getErrorMessage } from '@/shared/lib/error-message'

const COLS = 3
const GAP = 3
const SCREEN_W = Dimensions.get('window').width
const TILE = (SCREEN_W - 48 - GAP * (COLS - 1)) / COLS

function PhotoTile({ photo, onDelete }: { photo: Photo; onDelete: () => void }) {
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel="Progress photo. Long press to delete."
      onLongPress={() => {
        Alert.alert('Delete photo?', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ])
      }}
    >
      <Image
        source={{ uri: photo.thumbnailUrl ?? photo.url }}
        style={{ width: TILE, height: TILE, borderRadius: 6 }}
        contentFit="cover"
        transition={200}
      />
    </Pressable>
  )
}

export default function PhotosScreen() {
  const router = useRouter()
  const { data: photos, isLoading, isError, error, refetch } = useMyPhotos()
  const { mutate: deletePhoto } = useDeletePhoto()

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row justify-between items-center px-6 pt-6 pb-3">
          <Text variant="subtitle">Photos</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upload progress photo"
            onPress={() => router.push('/(client)/photos/upload')}
            className="bg-primary rounded-xl px-3.5 py-2 active:opacity-75"
          >
            <Text variant="small" className="text-white font-semibold">+ Upload</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View className="flex-row flex-wrap px-6 gap-[3px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} style={{ width: TILE, height: TILE, borderRadius: 6 }} />
            ))}
          </View>
        ) : isError ? (
          <ErrorState
            message={getErrorMessage(error, 'Could not load photos.')}
            onRetry={() => refetch()}
            className="m-6"
          />
        ) : photos && photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(p) => p.id}
            numColumns={COLS}
            columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <PhotoTile photo={item} onDelete={() => deletePhoto(item.id)} />
            )}
          />
        ) : (
          <EmptyState
            title="No photos yet"
            subtitle="Track your transformation by uploading progress photos."
            action="Upload first photo"
            onAction={() => router.push('/(client)/photos/upload')}
            className="m-6"
          />
        )}
      </SafeAreaView>
    </View>
  )
}
