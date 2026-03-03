import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { BaseUser } from "@/lib/types/user";

// ---------------------------------------------------------------------------
// Helpers — safe localStorage (Next.js SSR guard)
// ---------------------------------------------------------------------------

const isBrowser = typeof window !== "undefined";

function saveToStorage(key: string, value: string) {
  if (isBrowser) localStorage.setItem(key, value);
}

function removeFromStorage(key: string) {
  if (isBrowser) localStorage.removeItem(key);
}

function readFromStorage(key: string): string | null {
  return isBrowser ? localStorage.getItem(key) : null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Alias kept for backward compatibility — authApi imports this from here. */
export type AuthUser = BaseUser;

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

// ---------------------------------------------------------------------------
// Hydrate initial state from localStorage (persists across page refreshes)
// ---------------------------------------------------------------------------

const storedToken = readFromStorage("access_token");
const storedUser = (() => {
  try {
    const raw = readFromStorage("auth_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
})();

const initialState: AuthState = {
  accessToken: storedToken,
  user: storedUser,
  isAuthenticated: !!storedToken,
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Called after successful login or token refresh */
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user: AuthUser }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;

      saveToStorage("access_token", action.payload.accessToken);
      saveToStorage("auth_user", JSON.stringify(action.payload.user));
    },

    /** Called after a silent token refresh (access_token only) */
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      saveToStorage("access_token", action.payload);
    },

    /** Called on logout or auth failure */
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;

      removeFromStorage("access_token");
      removeFromStorage("auth_user");
    },
  },
});

export const { setCredentials, updateAccessToken, clearCredentials } =
  authSlice.actions;

export default authSlice.reducer;
