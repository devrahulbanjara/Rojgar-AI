import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Types — mirrors app/modules/applications/schemas.py
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'interview_booked'
  | 'interview_completed'
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
  share_profile_all?: boolean
  share_avatar?: boolean
  share_email?: boolean
  share_phone?: boolean
  share_location?: boolean
  share_links?: boolean
  share_headline_summary?: boolean
}

export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus
}

export interface UpdateApplicationReviewPayload {
  score?: number | null
  feedback?: string | null
}

export interface CandidateShareSettings {
  share_profile_all: boolean
  share_avatar: boolean
  share_email: boolean
  share_phone: boolean
  share_location: boolean
  share_links: boolean
  share_headline_summary: boolean
}

export interface RecruiterCandidateListItem {
  id: string
  candidate_id: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  applicant_name: string
  applicant_email: string | null
  applicant_avatar_url: string | null
  candidate_headline: string | null
  candidate_location: string | null
  job_title: string
  job_id: string
  score: number | null
  feedback: string | null
}

export interface RecruiterCandidateDetailView {
  id: string
  candidate_id: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  applicant_name: string
  applicant_email: string | null
  applicant_avatar_url: string | null
  candidate_headline: string | null
  candidate_summary: string | null
  candidate_phone: string | null
  candidate_location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  job_title: string
  job_id: string
  score: number | null
  feedback: string | null
  resume: {
    id: string
    user_id: string
    resume_name: string
    headline: string | null
    summary: string | null
    phone: string | null
    location: string | null
    linkedin_url: string | null
    github_url: string | null
    portfolio_url: string | null
    years_of_experience: number | null
    experiences: {
      id: string
      company_name: string
      title: string
      start_date: string | null
      end_date: string | null
      description: string[]
    }[]
    educations: {
      id: string
      institution: string
      degree: string | null
      field_of_study: string | null
      start_date: string | null
      end_date: string | null
    }[]
    skills: { id: string; skill_name: string }[]
    created_at: string
    updated_at: string
  } | null
  share_settings: CandidateShareSettings
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
      invalidatesTags: ['Applications', 'Candidates'],
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

    getMyCompanyCandidates: builder.query<
      ApiResponse<RecruiterCandidateListItem[]>,
      { page?: number; size?: number; job_id?: string; status?: ApplicationStatus } | void
    >({
      query: (params) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/company/me/candidates`,
        params: params ?? undefined,
      }),
      providesTags: ['Candidates'],
    }),

    getCompanyCandidateById: builder.query<ApiResponse<RecruiterCandidateDetailView>, string>({
      query: (applicationId) =>
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/company/me/candidates/${applicationId}`,
      providesTags: (_result, _error, id) => [{ type: 'Candidates', id }],
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
      invalidatesTags: ['Applications', 'Candidates'],
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
      invalidatesTags: ['Applications', 'Candidates'],
    }),
  }),
})

export const {
  useApplyToJobMutation,
  useGetMyApplicationsQuery,
  useGetMyCompanyApplicationsQuery,
  useGetMyCompanyCandidatesQuery,
  useGetCompanyCandidateByIdQuery,
  useGetJobApplicationsQuery,
  useUpdateApplicationReviewMutation,
  useUpdateApplicationStatusMutation,
} = applicationsApi
