import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Types — mirrors app/modules/applications/schemas.py
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'applied'
  | 'in_review'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'rejected'

export interface ApplicationResponse {
  id: string
  job_id: string
  user_id: string
  resume_id: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

export interface ApplicationListItem {
  id: string
  job_id: string
  user_id: string
  status: ApplicationStatus
  created_at: string
  applicant: {
    id: string
    full_name: string
    email: string
  }
}

export interface ApplyToJobPayload {
  job_id: string
  resume_id: string
}

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

export const applicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** POST /applications/ — candidate applies to a job */
    applyToJob: builder.mutation<ApiResponse<ApplicationResponse>, ApplyToJobPayload>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Applications'],
    }),

    /** GET /applications/me — list all applications for the current candidate */
    getMyApplications: builder.query<
      ApiResponse<ApplicationListItem[]>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/me`,
        params: params ?? undefined,
      }),
      providesTags: ['Applications'],
    }),
  }),
})

export const { useApplyToJobMutation, useGetMyApplicationsQuery } = applicationsApi
