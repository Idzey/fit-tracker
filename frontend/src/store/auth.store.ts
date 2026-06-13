import { create } from 'zustand'

export interface AuthUser {
  id: string
  role: 'TRAINER' | 'CLIENT'
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (params: { user: AuthUser; accessToken: string; refreshToken: string }) => void
  setTokens: (params: { accessToken: string; refreshToken: string }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: ({ user, accessToken, refreshToken }) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),
  setTokens: ({ accessToken, refreshToken }) =>
    set({ accessToken, refreshToken }),
  logout: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}))
