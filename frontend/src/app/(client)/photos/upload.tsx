import { useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { usePresignUpload } from '@/features/photos/hooks/use-presign-upload'
import { useConfirmUpload } from '@/features/photos/hooks/use-confirm-upload'

export default function UploadPhotoScreen() {
  const router = useRouter()
  const [uri, setUri] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [uploading, setUploading] = useState(false)

  const { mutateAsync: presign } = usePresignUpload()
  const { mutateAsync: confirm } = useConfirmUpload()

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission required', 'Grant photo library access to upload photos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setUri(asset.uri)
      setMimeType(asset.mimeType ?? 'image/jpeg')
    }
  }

  const upload = async () => {
    if (!uri) return
    setUploading(true)
    try {
      const { uploadUrl, key } = await presign({ mimeType })

      const blob = await fetch(uri).then((r) => r.blob())
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': mimeType },
      })
      if (!putRes.ok) throw new Error('Upload failed')

      await confirm({ key, takenAt: new Date().toISOString() })
      router.replace('/(client)/photos')
    } catch {
      Alert.alert('Upload failed', 'Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="p-6 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between mb-1">
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text variant="small" muted>← Back</Text>
            </Pressable>
            <Text variant="subtitle">Upload Photo</Text>
            <View style={{ width: 48 }} />
          </View>

          <Pressable onPress={pick} className="rounded-3xl overflow-hidden" style={{ height: 340 }}>
            {uri ? (
              <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View className="flex-1 bg-muted items-center justify-center gap-2">
                <Text className="text-5xl">📷</Text>
                <Text variant="small" muted>Tap to select a photo</Text>
              </View>
            )}
          </Pressable>

          {uri ? (
            <View className="gap-3">
              <Button
                label="Choose different photo"
                variant="secondary"
                onPress={pick}
              />
              <Button
                label={uploading ? 'Uploading…' : 'Upload'}
                loading={uploading}
                onPress={upload}
              />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
