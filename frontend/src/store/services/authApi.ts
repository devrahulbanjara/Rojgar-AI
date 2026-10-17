import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

import { type AuthUser, clearCredentials, setCredentials, updateUser } from '../slices/authSlice'
import { type ApiResponse, baseApi, refreshSession } from './baseApi'

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface SignupRequest {
  full_name: string
  email: string
  password: string
}

export interface OtpVerifyRequest {
  phone: string
  code: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

export interface ForgotPasswordRequest {
  email: string
}

export interface UpdateMeRequest {
  full_name: string
}

export interface ChangePasswordRequest {
  current_password?: string | null
  new_password: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

// ---------------------------------------------------------------------------
// Response data shapes (the `data` field inside the envelope)
// ---------------------------------------------------------------------------

export interface LoginData {
  tokens: {
    access_token: string
    token_type: 'bearer'
  }
  user: AuthUser
  /** True when a phone sign-in just created the account. */
  is_new?: boolean
}

/** Which ways to sign in are switched on (GET /auth/options). */
export interface AuthOptions {
  sms: boolean
  google: boolean
  email_link: boolean
}

const FALLBACK_OPTIONS: AuthOptions = { sms: false, google: true, email_link: false }
const OPTIONS_KEY = 'rojgarai:authOptions'

function readCachedOptions(): AuthOptions | null {
  try {
    const raw = window.sessionStorage.getItem(OPTIONS_KEY)
    return raw ? (JSON.parse(raw) as AuthOptions) : null
  } catch {
    return null
  }
}

export interface RefreshData {
  access_token: string
  token_type: 'bearer'
}

// Convenience alias for endpoints that return data: null
type EmptyResponse = ApiResponse<null>

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** POST /auth/signup — 201; the verification link is emailed. */
    signup: builder.mutation<EmptyResponse, SignupRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /auth/verify-email — 200, data: null */
    verifyEmail: builder.mutation<EmptyResponse, VerifyEmailRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-email`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /auth/login — 200, data: { tokens, user }
     *  Stores access_token + user in Redux + localStorage on success.
     *  refresh_token is set as HttpOnly cookie by the backend. */
    login: builder.mutation<ApiResponse<LoginData>, LoginRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
        method: 'POST',
        body,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.success && data.data) {
            dispatch(
              setCredentials({
                accessToken: data.data.tokens.access_token,
                user: data.data.user,
                rememberMe: args.remember_me ?? false,
              }),
            )
          }
        } catch {
          // login failure — nothing to store
        }
      },
    }),

    /** GET /auth/options — sign-in methods that work right now. */
    getAuthOptions: builder.query<AuthOptions, void>({
      // Asked once per browser session; if the server can't say, email and Google only.
      async queryFn(_arg, _api, _extra, baseQuery) {
        const cached = readCachedOptions()
        if (cached) return { data: cached }
        const result = await baseQuery(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/options`)
        const options = {
          ...FALLBACK_OPTIONS,
          ...((result.data as ApiResponse<Partial<AuthOptions>> | undefined)?.data ?? {}),
        }
        try {
          window.sessionStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
        } catch {
          // Storage unavailable: ask again next time.
        }
        return { data: options }
      },
      keepUnusedDataFor: 3600,
    }),

    /** POST /auth/otp/request — texts a 6-digit code to a Nepali mobile. */
    requestPhoneCode: builder.mutation<EmptyResponse, { phone: string }>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/otp/request`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /auth/otp/verify — signs in (or up); sets the refresh cookie. */
    verifyPhoneCode: builder.mutation<ApiResponse<LoginData>, OtpVerifyRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/otp/verify`,
        method: 'POST',
        body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.success && data.data) {
            dispatch(
              setCredentials({
                accessToken: data.data.tokens.access_token,
                user: data.data.user,
                rememberMe: true,
              }),
            )
          }
        } catch {
          // wrong or expired code — the form shows the message
        }
      },
    }),

    /** POST /auth/me/active-business — work in another of my businesses. */
    setActiveBusiness: builder.mutation<ApiResponse<AuthUser>, { business_id: string }>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/active-business`,
        method: 'POST',
        body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.success && data.data) {
            dispatch(updateUser(data.data))
            // Every business-scoped list must reload for the new business.
            dispatch(baseApi.util.resetApiState())
          }
        } catch {
          // handled by caller
        }
      },
    }),

    /** POST /auth/refresh — 200, data: { access_token, token_type }
     *  Reads refresh_token from HttpOnly cookie automatically.
     *  The reauth wrapper in baseApi calls this transparently on 401. */
    refresh: builder.mutation<ApiResponse<RefreshData>, void>({
      async queryFn() {
        const refreshed = await refreshSession()
        return refreshed.token
          ? { data: refreshed.body as ApiResponse<RefreshData> }
          : { error: { status: refreshed.status, data: refreshed.body } as FetchBaseQueryError }
      },
    }),

    /** POST /auth/logout — 200, data: null
     *  Backend clears the refresh_token cookie.
     *  We clear Redux + localStorage here. */
    logout: builder.mutation<EmptyResponse, void>({
      query: () => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`,
        method: 'POST',
        body: {},
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } finally {
          dispatch(clearCredentials())
          // Drop every cached query so the next user on this browser never
          // sees the previous user's data (and no refetch fires with no token).
          dispatch(baseApi.util.resetApiState())
        }
      },
    }),

    /** POST /auth/forgot-password — 200, data: null */
    forgotPassword: builder.mutation<EmptyResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forgot-password`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /auth/reset-password — 200, data: null */
    resetPassword: builder.mutation<EmptyResponse, ResetPasswordRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/reset-password`,
        method: 'POST',
        body,
      }),
    }),

    /** GET /auth/me — 200, data: AuthUser */
    getMe: builder.query<ApiResponse<AuthUser>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
      providesTags: ['User'],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.success && data.data) {
            // Keep Redux state and localStorage in sync with latest server data
            dispatch(updateUser(data.data))
          }
        } catch {
          // unauthenticated — handled by reauth wrapper
        }
      },
    }),

    updateMe: builder.mutation<ApiResponse<AuthUser>, UpdateMeRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
        method: 'PATCH',
        body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.success && data.data) {
            dispatch(updateUser(data.data))
          }
        } catch {
          // handled by caller
        }
      },
      invalidatesTags: ['User', 'Company'],
    }),

    updateMyAuthAvatar: builder.mutation<ApiResponse<AuthUser>, FormData>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/avatar`,
        method: 'PATCH',
        body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.success && data.data) {
            dispatch(updateUser(data.data))
          }
        } catch {
          // handled by caller
        }
      },
      invalidatesTags: ['User', 'Company'],
    }),

    removeMyAuthAvatar: builder.mutation<EmptyResponse, void>({
      query: () => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/avatar`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'Company'],
    }),

    changeMyPassword: builder.mutation<EmptyResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/password`,
        method: 'PATCH',
        body,
      }),
    }),

    /** DELETE /auth/me — soft-deletes the authenticated user's account */
    deleteAccount: builder.mutation<EmptyResponse, void>({
      query: () => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: true,
})

export const {
  useSignupMutation,
  useVerifyEmailMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateMeMutation,
  useUpdateMyAuthAvatarMutation,
  useRemoveMyAuthAvatarMutation,
  useChangeMyPasswordMutation,
  useDeleteAccountMutation,
  useRequestPhoneCodeMutation,
  useVerifyPhoneCodeMutation,
  useSetActiveBusinessMutation,
  useGetAuthOptionsQuery,
} = authApi

/**
 * Sign-in methods to offer. Until the server answers (or if it can't), only
 * email and Google: the phone code shows only when SMS is switched on.
 */
export function useAuthOptions(): AuthOptions {
  return useGetAuthOptionsQuery().data ?? FALLBACK_OPTIONS
}

// ---------------------------------------------------------------------------
// Google OAuth — browser-redirect based (not an RTK mutation)
// ---------------------------------------------------------------------------

/**
 * Kick off the Google OAuth flow by redirecting the browser to the backend's
 * Google auth route directly (bypassing the Next.js proxy).
 * This ensures the auth cookie is set on the correct domain (backend) for
 * when Google redirects back to the backend's callback URL.
 */
export function initiateGoogleOAuth(): void {
  if (typeof window === 'undefined') return
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')

  if (!apiUrl) {
    console.error('NEXT_PUBLIC_BACKEND_URL environment variable is not defined')
    return
  }

  // Absolute backend URL (full-page redirect to Google), not an internal route.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `${apiUrl}/auth/google`
}
