import { type AuthUser, clearCredentials, setCredentials, updateUser } from '../slices/authSlice'
import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface SignupRequest {
  full_name: string
  email: string
  password: string
  primary_role: 'candidate' | 'recruiter_admin' | 'recruiter'
}

export interface GoogleRegisterRequest {
  signup_token: string
  primary_role: 'candidate' | 'recruiter_admin' | 'recruiter'
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
}

export interface RefreshData {
  access_token: string
  token_type: 'bearer'
}

/** Returned by POST /auth/signup for company and recruiter roles. */
export interface SignupData {
  setup_token: string | null
}

// Convenience alias for endpoints that return data: null
type EmptyResponse = ApiResponse<null>
type SignupResponse = ApiResponse<SignupData | null>

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** POST /auth/signup — 201, data: SignupData | null */
    signup: builder.mutation<SignupResponse, SignupRequest>({
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

    /** POST /auth/refresh — 200, data: { access_token, token_type }
     *  Reads refresh_token from HttpOnly cookie automatically.
     *  The reauth wrapper in baseApi calls this transparently on 401. */
    refresh: builder.mutation<ApiResponse<RefreshData>, void>({
      query: () => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`,
        method: 'POST',
        body: {},
      }),
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
        // Optimistically clear local state before the request resolves
        dispatch(clearCredentials())
        try {
          await queryFulfilled
        } catch {
          // Even if the network call fails, local session is already cleared
        }
      },
      invalidatesTags: ['User', 'Company', 'Jobs', 'Applications', 'Candidates', 'Interviews'],
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

    /** POST /auth/google/register — 201, data: LoginData | SignupData */
    googleRegister: builder.mutation<ApiResponse<LoginData | SignupData>, GoogleRegisterRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/register`,
        method: 'POST',
        body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.success && data.data && 'tokens' in data.data) {
            dispatch(
              setCredentials({
                accessToken: data.data.tokens.access_token,
                user: data.data.user,
                rememberMe: true, // we assume true for oauth
              }),
            )
          }
        } catch {
          // failure
        }
      },
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
  useGoogleRegisterMutation,
} = authApi

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

  window.location.href = `${apiUrl}/auth/google`
}
