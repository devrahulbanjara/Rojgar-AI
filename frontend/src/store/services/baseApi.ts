import { LIVE_DATA_UNAVAILABLE_MESSAGE, isBackendConnectionStatus } from '@/lib/backendConnection'
import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react'

import { clearCredentials, updateAccessToken } from '../slices/authSlice'
import { clearBackendConnectionIssue, reportBackendConnectionIssue } from '../slices/uiSlice'

// ---------------------------------------------------------------------------
// Unified response envelope (matches backend contract)
// ---------------------------------------------------------------------------

export interface ApiMeta {
  timestamp: string
  requestId: string | null
}

/** Validation error item returned by the backend as an array */
export interface ApiFieldError {
  field: string
  message: string
}

/**
 * Unified response envelope for every backend endpoint.
 *
 * Success:    { success: true,  data: T,    errors: null }
 * Validation: { success: false, data: null, errors: ApiFieldError[] }
 * HTTP error: { success: false, data: null, errors: null, message: "..." }
 */
export interface ApiResponse<T = null> {
  success: boolean
  message: string
  data: T
  errors: ApiFieldError[] | null
  meta: ApiMeta
}

// ---------------------------------------------------------------------------
// Raw base query — credentials: include ensures the HttpOnly refresh_token
// cookie is sent automatically on every request.
// ---------------------------------------------------------------------------

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '', // all endpoints use absolute NEXT_PUBLIC_BACKEND_URL URLs
  credentials: 'include', // sends HttpOnly refresh_token cookie on every request
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// ---------------------------------------------------------------------------
// Re-auth wrapper — on 401, silently call /auth/refresh and retry once.
// A shared promise queues all concurrent 401 requests so they all retry
// after the single refresh completes instead of surfacing 401 errors.
// ---------------------------------------------------------------------------

let refreshPromise: Promise<string | null> | null = null

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshResult = await rawBaseQuery(
          {
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`,
            method: 'POST',
            body: {},
          },
          api,
          extraOptions,
        )

        const refreshData = refreshResult.data as
          | ApiResponse<{ access_token: string; token_type: string }>
          | undefined

        if (refreshData?.success && refreshData.data?.access_token) {
          api.dispatch(updateAccessToken(refreshData.data.access_token))
          return refreshData.data.access_token
        } else if (isBackendConnectionStatus(refreshResult.error?.status)) {
          api.dispatch(reportBackendConnectionIssue(LIVE_DATA_UNAVAILABLE_MESSAGE))
        } else {
          api.dispatch(clearCredentials())
        }
        return null
      })()
    }

    const newToken = await refreshPromise
    refreshPromise = null

    if (newToken) {
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }

  if (result.error && isBackendConnectionStatus(result.error.status)) {
    api.dispatch(reportBackendConnectionIssue(LIVE_DATA_UNAVAILABLE_MESSAGE))
  } else if (result.data) {
    api.dispatch(clearBackendConnectionIssue())
  }

  return result
}

// ---------------------------------------------------------------------------
// Base API slice — all feature slices inject their endpoints here.
// ---------------------------------------------------------------------------

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Company',
    'Jobs',
    'Applications',
    'Candidates',
    'Interviews',
    'Profile',
    'Resumes',
    'Evaluation',
    'Activity',
    'Audit',
    'Notifications',
    'RecruiterPreferences',
    'Availability',
    'CompanyPlan',
  ],
  endpoints: () => ({}),
})
