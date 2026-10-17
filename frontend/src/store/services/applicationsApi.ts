import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Types — mirrors app/modules/applications/schemas.py
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_booked'
  | 'interview_completed'
  | 'offer'
  | 'offer_accepted'
  | 'offer_declined'
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
  strengths: string[] | null
  weaknesses: string[] | null
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
  job_title: string | null
  company_name: string | null
  company_logo_url: string | null
  location: string | null
  location_type: 'remote' | 'onsite' | 'hybrid' | null
  interview: {
    id: string
    start_time: string
    end_time: string
    timezone: string | null
    location: string | null
    title: string | null
    created_at: string
  } | null
  timeline: ActivityEvent[]
  next_step_hint: string | null
}

export interface ActivityEvent {
  id: string
  user_id: string | null
  company_id: string | null
  application_id: string | null
  job_id: string | null
  interview_id: string | null
  draft_id: string | null
  actor_user_id: string | null
  event_type: string
  audience: string
  title: string
  description: string | null
  href: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ApplicationOutreachAuditItem {
  draft_id: string
  subject: string | null
  is_approved: boolean
  is_sent: boolean
  is_discarded: boolean
  generated_by_user_id: string | null
  approved_by_user_id: string | null
  approved_at: string | null
  sent_by_user_id: string | null
  sent_at: string | null
  discarded_by_user_id: string | null
  discarded_at: string | null
  updated_at: string
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
  strengths: string[] | null
  weaknesses: string[] | null
}

export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus
}

export interface UpdateApplicationReviewPayload {
  score?: number | null
  strengths?: string[] | null
  weaknesses?: string[] | null
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
  candidate_id: string
  applicant_name: string
  applicant_email: string
  applicant_avatar_url: string | null
  latest_application_id: string
  latest_status: ApplicationStatus
  latest_applied_at: string
  latest_updated_at: string
  primary_job_title: string
  primary_job_id: string
  /** Not sent yet by the backend; shown when present. */
  applicant_phone?: string | null
  /** false = applied without a CV. Not sent yet by the backend. */
  has_cv_file?: boolean
  /** Job category ("Accounting", "Nursing", "Hospitality"). Not sent yet by the backend. */
  primary_job_category?: string | null
  application_count: number
  applications: RecruiterCandidateApplicationSummary[]
}

export interface RecruiterCandidateApplicationSummary {
  application_id: string
  job_id: string
  job_title: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  /** pending | completed | failed | needs_human_review */
  ai_review_status?: string | null
  score: number | null
  strengths: string[] | null
  weaknesses: string[] | null
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
  strengths: string[] | null
  weaknesses: string[] | null
  interview: {
    id: string
    start_time: string
    end_time: string
    timezone: string | null
    location: string | null
    title: string | null
    created_at: string
  } | null
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
  timeline: ActivityEvent[]
  outreach_audit: ApplicationOutreachAuditItem[]
}

export interface SemanticCandidateSearchResult {
  application_id: string
  candidate_id: string
  applicant_name: string
  applicant_email: string
  applicant_avatar_url: string | null
  job_title: string
  job_id: string
  status: ApplicationStatus
  score: number | null
  strengths: string[] | null
  weaknesses: string[] | null
  match_score: number
  applied_at: string
  updated_at: string
}

export interface SemanticCandidateSearchResponse {
  query: string
  total: number
  candidates: SemanticCandidateSearchResult[]
}

export interface SimilarCandidateResult {
  application_id: string
  candidate_id: string
  applicant_name: string
  applicant_email: string
  applicant_avatar_url: string | null
  job_title: string
  job_id: string
  status: ApplicationStatus
  score: number | null
  similarity_score: number
  applied_at: string
  updated_at: string
}

export interface SimilarCandidatesResponse {
  reference_application_id: string
  reference_candidate_name: string
  total: number
  candidates: SimilarCandidateResult[]
}

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

export const applicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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

    getCompanyCandidateTimeline: builder.query<ApiResponse<ActivityEvent[]>, string>({
      query: (applicationId) =>
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/company/me/candidates/${applicationId}/timeline`,
      providesTags: (_result, _error, id) => [{ type: 'Activity', id }],
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

    /** GET /applications/company/me/candidates/search — semantic candidate search */
    semanticSearchCandidates: builder.query<
      ApiResponse<SemanticCandidateSearchResponse>,
      { q: string; status?: string[]; page?: number; size?: number }
    >({
      query: (params) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/company/me/candidates/search`,
        params,
      }),
      providesTags: ['Candidates'],
    }),

    /** GET /applications/company/me/candidates/{id}/similar — find similar candidates */
    getSimilarCandidates: builder.query<
      ApiResponse<SimilarCandidatesResponse>,
      { application_id: string; limit?: number }
    >({
      query: ({ application_id, limit }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/applications/company/me/candidates/${application_id}/similar`,
        params: limit ? { limit } : undefined,
      }),
      providesTags: (_result, _error, { application_id }) => [
        { type: 'Candidates', id: application_id },
      ],
    }),
  }),
})

export const {
  useGetMyCompanyApplicationsQuery,
  useGetMyCompanyCandidatesQuery,
  useGetCompanyCandidateByIdQuery,
  useGetCompanyCandidateTimelineQuery,
  useGetJobApplicationsQuery,
  useUpdateApplicationReviewMutation,
  useUpdateApplicationStatusMutation,
  useSemanticSearchCandidatesQuery,
  useLazySemanticSearchCandidatesQuery,
  useGetSimilarCandidatesQuery,
  useLazyGetSimilarCandidatesQuery,
} = applicationsApi
