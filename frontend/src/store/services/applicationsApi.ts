import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Types — mirrors app/modules/applications/schemas.py
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'submitted'
  | 'screening'
  | 'interview_booked'
  | 'interview'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

export interface ApplicationResponse {
  id: string
  job_id: string
  user_id: string
  resume_id: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  score: number | null
  feedback: string | null
}

export interface CandidateApplicationView {
  id: string
  job_id: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  job_title: string
  company_name: string
  company_logo_url: string | null
  location: string | null
  location_type: 'remote' | 'onsite' | 'hybrid'
  score: number | null
  feedback: string | null
}

export interface RecruiterApplicationView {
  id: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  applicant_name: string
  applicant_email: string
  applicant_avatar_url: string | null
  job_title: string
  job_id: string
  score: number | null
  feedback: string | null
}

export interface ApplicationApplicantSummary {
  id: string
  full_name: string
  email: string
}

export interface LegacyApplicationListItem {
  id: string
  job_id: string
  user_id: string
  status: ApplicationStatus
  created_at: string
  applicant: ApplicationApplicantSummary
}

export interface ApplyToJobPayload {
  job_id: string
  resume_id: string
}

export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus
}

export interface UpdateApplicationReviewPayload {
  score?: number | null
  feedback?: string | null
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
      ApiResponse<CandidateApplicationView[]>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/me`,
        params: params ?? undefined,
      }),
      providesTags: ['Applications'],
    }),

    /** GET /applications/company/me — list all company applications, optionally filtered by job */
    getMyCompanyApplications: builder.query<
      ApiResponse<RecruiterApplicationView[]>,
      { page?: number; size?: number; job_id?: string } | void
    >({
      query: (params) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/company/me`,
        params: params ?? undefined,
      }),
      providesTags: ['Applications'],
    }),

    getJobApplications: builder.query<
      ApiResponse<RecruiterApplicationView[]>,
      { job_id: string; page?: number; size?: number }
    >({
      query: ({ job_id, ...params }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/job/${job_id}`,
        params,
      }),
      providesTags: ['Applications'],
    }),

    updateApplicationStatus: builder.mutation<
      ApiResponse<ApplicationResponse>,
      { application_id: string; body: UpdateApplicationStatusPayload }
    >({
      query: ({ application_id, body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/${application_id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Applications'],
    }),

    updateApplicationReview: builder.mutation<
      ApiResponse<ApplicationResponse>,
      { application_id: string; body: UpdateApplicationReviewPayload }
    >({
      query: ({ application_id, body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/${application_id}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Applications'],
    }),
  }),
})

export const {
  useApplyToJobMutation,
  useGetMyApplicationsQuery,
  useGetMyCompanyApplicationsQuery,
  useGetJobApplicationsQuery,
  useUpdateApplicationReviewMutation,
  useUpdateApplicationStatusMutation,
} = applicationsApi
