import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

export const queryPersister = createAsyncStoragePersister({
  key: 'fittrack-query-cache-v1',
  storage: AsyncStorage,
  throttleTime: 1_000,
})

export const queryPersistOptions = {
  persister: queryPersister,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  buster: 'fittrack-v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string } }) => query.state.status === 'success',
    shouldDehydrateMutation: (mutation: { state: { isPaused: boolean } }) => mutation.state.isPaused,
  },
}

export function clearPersistedQueryClient() {
  return queryPersister.removeClient()
}
