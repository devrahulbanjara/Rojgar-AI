import type { BaseUser } from '@/lib/types/user'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

const isBrowser = typeof window !== 'undefined'

const REMEMBER_KEY = 'remember_me'
const TOKEN_KEY = 'access_token'
const USER_KEY = 'auth_user'
const AUTH_COOKIE = 'auth_present'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function setAuthCookie() {
  if (!isBrowser) return
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

function clearAuthCookie() {
  if (!isBrowser) return
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

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

// The access token lives in memory only. Persisting it to web storage lets any
// XSS read it; after a reload the HttpOnly refresh cookie mints a new one
// (AuthGuard / the 401 re-auth wrapper). Purge tokens stored by older builds.
removeFromStorage(TOKEN_KEY)

function hasAuthCookie(): boolean {
  if (!isBrowser) return false
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${AUTH_COOKIE}=1`))
}

const storedUser = (() => {
  try {
    const raw = readFromStorage(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
})()

const initialState: AuthState = {
  accessToken: null,
  user: storedUser,
  isAuthenticated: !!storedUser && hasAuthCookie(),
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
          sessionStorage.removeItem(USER_KEY)
          localStorage.setItem(USER_KEY, JSON.stringify(user))
        } else {
          localStorage.removeItem(USER_KEY)
          sessionStorage.setItem(USER_KEY, JSON.stringify(user))
        }
        setAuthCookie()
      }
    },

    updateUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      saveToStorage(USER_KEY, JSON.stringify(action.payload))
    },

    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
      state.isAuthenticated = Boolean(action.payload)
    },

    clearCredentials(state) {
      state.accessToken = null
      state.user = null
      state.isAuthenticated = false

      removeFromStorage(TOKEN_KEY)
      removeFromStorage(USER_KEY)
      if (isBrowser) {
        localStorage.removeItem(REMEMBER_KEY)
        clearAuthCookie()
      }
    },
  },
})

export const { setCredentials, updateAccessToken, updateUser, clearCredentials } = authSlice.actions

export default authSlice.reducer
