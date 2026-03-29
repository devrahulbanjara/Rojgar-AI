import type { BaseUser } from '@/lib/types/user'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

const isBrowser = typeof window !== 'undefined'

const REMEMBER_KEY = 'remember_me'
const TOKEN_KEY = 'access_token'
const USER_KEY = 'auth_user'

function getActiveStorage(): Storage | null {
  if (!isBrowser) return null
  return localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage : sessionStorage
}

function saveToStorage(key: string, value: string) {
  getActiveStorage()?.setItem(key, value)
}

function removeFromStorage(key: string) {
  if (!isBrowser) return
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

function readFromStorage(key: string): string | null {
  return getActiveStorage()?.getItem(key) ?? null
}

export type AuthUser = BaseUser

export interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
}

const storedToken = readFromStorage(TOKEN_KEY)
const storedUser = (() => {
  try {
    const raw = readFromStorage(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
})()

const initialState: AuthState = {
  accessToken: storedToken,
  user: storedUser,
  isAuthenticated: !!storedToken,
}
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        accessToken: string
        user: AuthUser
        rememberMe?: boolean
      }>,
    ) {
      const { accessToken, user, rememberMe = false } = action.payload
      state.accessToken = accessToken
      state.user = user
      state.isAuthenticated = true

      if (isBrowser) {
        localStorage.setItem(REMEMBER_KEY, String(rememberMe))
        if (rememberMe) {
          sessionStorage.removeItem(TOKEN_KEY)
          sessionStorage.removeItem(USER_KEY)
          localStorage.setItem(TOKEN_KEY, accessToken)
          localStorage.setItem(USER_KEY, JSON.stringify(user))
        } else {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          sessionStorage.setItem(TOKEN_KEY, accessToken)
          sessionStorage.setItem(USER_KEY, JSON.stringify(user))
        }
      }
    },

    updateUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      saveToStorage(USER_KEY, JSON.stringify(action.payload))
    },

    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
      state.isAuthenticated = Boolean(action.payload)
      saveToStorage(TOKEN_KEY, action.payload)
    },

    clearCredentials(state) {
      state.accessToken = null
      state.user = null
      state.isAuthenticated = false

      removeFromStorage(TOKEN_KEY)
      removeFromStorage(USER_KEY)
      if (isBrowser) localStorage.removeItem(REMEMBER_KEY)
    },
  },
})

export const { setCredentials, updateAccessToken, updateUser, clearCredentials } = authSlice.actions

export default authSlice.reducer
