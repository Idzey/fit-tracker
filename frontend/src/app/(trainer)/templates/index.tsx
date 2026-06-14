import { useRouter } from 'expo-router'
import { FlatList, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { TemplateCard } from '@/features/templates/components/template-card'
import { useTemplates } from '@/features/templates/hooks/use-templates'
import { getErrorMessage } from '@/shared/lib/error-message'

export default function TemplatesScreen() {
  const router = useRouter()
  const { data: templates, isLoading, isError, error, refetch } = useTemplates()

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row justify-between items-end px-6 pt-4 pb-3">
          <Text variant="subtitle">Templates</Text>
          {templates ? (
            <Text variant="small" muted>{templates.length} total</Text>
          ) : null}
        </View>

        {isLoading ? (
          <View className="px-6 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="rounded-2xl" />)}
          </View>
        ) : isError ? (
          <ErrorState
            message={getErrorMessage(error, 'Could not load templates.')}
            onRetry={() => refetch()}
            className="mx-6 mt-10"
          />
        ) : (
          <FlatList
            data={templates ?? []}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TemplateCard
                template={item}
                onPress={() => router.push(`/(trainer)/templates/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title="No templates yet"
                subtitle="Create a workout template to assign to clients"
                action="Create template"
                onAction={() => router.push('/(trainer)/templates/new')}
                className="mt-10"
              />
            }
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create template"
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
          style={{ shadowColor: '#3c87f7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}
          onPress={() => router.push('/(trainer)/templates/new')}
        >
          <Text className="text-white text-3xl leading-8 font-light">+</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}
