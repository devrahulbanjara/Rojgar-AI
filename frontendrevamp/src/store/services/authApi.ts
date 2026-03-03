import { baseApi, type ApiResponse } from "./baseApi";
import {
  clearCredentials,
  setCredentials,
  type AuthUser,
} from "../slices/authSlice";

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
  primary_role: "candidate" | "company" | "recruiter";
}

export interface VerifyEmailRequest {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ---------------------------------------------------------------------------
// Response data shapes (the `data` field inside the envelope)
// ---------------------------------------------------------------------------

export interface LoginData {
  tokens: {
    access_token: string;
    token_type: "bearer";
  };
  user: AuthUser;
}

export interface RefreshData {
  access_token: string;
  token_type: "bearer";
}

// Convenience alias for endpoints that return data: null
type EmptyResponse = ApiResponse<null>;

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** POST /auth/signup — 201, data: null */
    signup: builder.mutation<EmptyResponse, SignupRequest>({
      query: (body) => ({
        url: "/auth/signup",
        method: "POST",
        body,
      }),
    }),

    /** POST /auth/verify-email — 200, data: null */
    verifyEmail: builder.mutation<EmptyResponse, VerifyEmailRequest>({
      query: (body) => ({
        url: "/auth/verify-email",
        method: "POST",
        body,
      }),
    }),

    /** POST /auth/login — 200, data: { tokens, user }
     *  Stores access_token + user in Redux + localStorage on success.
     *  refresh_token is set as HttpOnly cookie by the backend. */
    login: builder.mutation<ApiResponse<LoginData>, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            dispatch(
              setCredentials({
                accessToken: data.data.tokens.access_token,
                user: data.data.user,
              }),
            );
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
        url: "/auth/refresh",
        method: "POST",
        body: {},
      }),
    }),

    /** POST /auth/logout — 200, data: null
     *  Backend clears the refresh_token cookie.
     *  We clear Redux + localStorage here. */
    logout: builder.mutation<EmptyResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        body: {},
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        // Optimistically clear local state before the request resolves
        dispatch(clearCredentials());
        try {
          await queryFulfilled;
        } catch {
          // Even if the network call fails, local session is already cleared
        }
      },
      invalidatesTags: [
        "User",
        "Company",
        "Jobs",
        "Applications",
        "Candidates",
        "Interviews",
      ],
    }),

    /** POST /auth/forgot-password — 200, data: null */
    forgotPassword: builder.mutation<EmptyResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    /** POST /auth/reset-password — 200, data: null */
    resetPassword: builder.mutation<EmptyResponse, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    /** GET /auth/me — 200, data: AuthUser */
    getMe: builder.query<ApiResponse<AuthUser>, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            // Keep localStorage user record in sync
            if (typeof window !== "undefined") {
              localStorage.setItem("auth_user", JSON.stringify(data.data));
            }
          }
        } catch {
          // unauthenticated — handled by reauth wrapper
        }
      },
    }),
  }),
  overrideExisting: true,
});

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
} = authApi;

// ---------------------------------------------------------------------------
// Google OAuth — browser-redirect based (not an RTK mutation)
// ---------------------------------------------------------------------------

/**
 * Kick off the Google OAuth flow by redirecting the browser to the backend's
 * Google auth route (proxied through Next.js /api rewrite).
 * The backend handles the consent screen and eventually redirects to
 * /auth/oauth-callback?access_token=JWT
 */
export function initiateGoogleOAuth(): void {
  if (typeof window === "undefined") return;
  window.location.href = "/api/auth/google";
}
