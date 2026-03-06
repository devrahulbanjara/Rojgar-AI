import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { clearCredentials, updateAccessToken } from "../slices/authSlice";

// ---------------------------------------------------------------------------
// Unified response envelope (matches backend contract)
// ---------------------------------------------------------------------------

export interface ApiMeta {
  timestamp: string;
  requestId: string | null;
}

/** Validation error item returned by the backend as an array */
export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Unified response envelope for every backend endpoint.
 *
 * Success:    { success: true,  data: T,    errors: null }
 * Validation: { success: false, data: null, errors: ApiFieldError[] }
 * HTTP error: { success: false, data: null, errors: null, message: "..." }
 */
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
  errors: ApiFieldError[] | null;
  meta: ApiMeta;
}

// ---------------------------------------------------------------------------
// Raw base query — credentials: include ensures the HttpOnly refresh_token
// cookie is sent automatically on every request.
// ---------------------------------------------------------------------------

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "", // all endpoints use absolute NEXT_PUBLIC_BACKEND_URL URLs
  credentials: "include", // sends HttpOnly refresh_token cookie on every request
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth
      .accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// ---------------------------------------------------------------------------
// Re-auth wrapper — on 401, silently call /auth/refresh and retry once.
// A boolean lock prevents concurrent refresh races.
// ---------------------------------------------------------------------------

let isRefreshing = false;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isRefreshing) {
    isRefreshing = true;

    // refresh_token is in the HttpOnly cookie — just POST with no body
    const refreshResult = await rawBaseQuery(
      {
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`,
        method: "POST",
        body: {},
      },
      api,
      extraOptions,
    );

    isRefreshing = false;

    const refreshData = refreshResult.data as
      | ApiResponse<{ access_token: string; token_type: string }>
      | undefined;

    if (refreshData?.success && refreshData.data?.access_token) {
      api.dispatch(updateAccessToken(refreshData.data.access_token));
      // Retry original request with the new token
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — wipe session, UI handles redirect
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

// ---------------------------------------------------------------------------
// Base API slice — all feature slices inject their endpoints here.
// ---------------------------------------------------------------------------

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Company",
    "Jobs",
    "Applications",
    "Candidates",
    "Interviews",
    "Profile",
    "Resumes",
  ],
  endpoints: () => ({}),
});
