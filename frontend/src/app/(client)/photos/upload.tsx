import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { usePresignUpload } from '@/features/photos/hooks/use-presign-upload'
import { useConfirmUpload } from '@/features/photos/hooks/use-confirm-upload'
import { Spacing } from '@/constants/theme'
import { Button } from '@/shared/components/button'

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
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText type="default" themeColor="textSecondary">← Back</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">Upload Photo</ThemedText>
            <View style={{ width: 48 }} />
          </View>

          <Pressable onPress={pick} style={styles.pickZone}>
            {uri ? (
              <Image source={{ uri }} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.placeholder}>
                <ThemedText type="default" themeColor="textSecondary" style={styles.placeholderIcon}>
                  📷
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Tap to select a photo</ThemedText>
              </View>
            )}
          </Pressable>

          {uri ? (
            <View style={styles.actions}>
              <Button
                label="Choose different photo"
                variant="secondary"
                onPress={pick}
                style={styles.btnAlt}
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
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  pickZone: { borderRadius: 20, overflow: 'hidden', height: 340 },
  preview: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  placeholderIcon: { fontSize: 40 },
  actions: { gap: 12 },
  btnAlt: {},
})
