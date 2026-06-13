import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const webStore = {
  getItemAsync: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItemAsync: (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve() },
  deleteItemAsync: (key: string) => { localStorage.removeItem(key); return Promise.resolve() },
}

const store = Platform.OS === 'web' ? webStore : SecureStore

export const secureStore = {
  getAccessToken: () => store.getItemAsync('access_token'),
  setAccessToken: (v: string) => store.setItemAsync('access_token', v),
  getRefreshToken: () => store.getItemAsync('refresh_token'),
  setRefreshToken: (v: string) => store.setItemAsync('refresh_token', v),
  clearTokens: async () => {
    await store.deleteItemAsync('access_token')
    await store.deleteItemAsync('refresh_token')
  },
}
