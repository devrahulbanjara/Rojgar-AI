import type { BaseUser } from '@/lib/types/user'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

// ---------------------------------------------------------------------------
// Helpers — safe storage (Next.js SSR guard)
// ---------------------------------------------------------------------------

const isBrowser = typeof window !== 'undefined'

// Preference key stored in localStorage so we know which storage is active
// on subsequent page loads (cannot read sessionStorage on a new session anyway,
// but we need it to route updateUser / updateAccessToken correctly).
const REMEMBER_KEY = 'remember_me'
const TOKEN_KEY = 'access_token'
const USER_KEY = 'auth_user'

/** Returns the storage that was chosen at login time. */
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Alias kept for backward compatibility — authApi imports this from here. */
export type AuthUser = BaseUser

export interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
}

// ---------------------------------------------------------------------------
// Hydrate initial state — reads from the storage chosen at last login.
// If REMEMBER_KEY is "true" in localStorage, credentials live in localStorage
// (persistent). Otherwise they live in sessionStorage (session-only).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called after successful login.
     *  rememberMe=true  → localStorage  (survives browser restart)
     *  rememberMe=false → sessionStorage (cleared when the tab/browser closes)
     */
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
        // Persist the preference so subsequent reads go to the right storage
        localStorage.setItem(REMEMBER_KEY, String(rememberMe))
        // Clear the «other» storage so stale credentials don't linger
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

    /** Called when only the user record needs updating (e.g. after /auth/me refresh) */
    updateUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      saveToStorage(USER_KEY, JSON.stringify(action.payload))
    },

    /** Called after a silent token refresh (access_token only) */
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
      saveToStorage(TOKEN_KEY, action.payload)
    },

    /** Called on logout or auth failure */
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
