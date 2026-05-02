import type { ApiResponse } from './baseApi'
import { baseApi } from './baseApi'

export type JobAIMode = 'create' | 'improve' | 'clone'
export type JobAIDecisionAction = 'approve' | 'edit' | 'regenerate' | 'reject' | 'save_draft'
export type JobAILocationType = 'onsite' | 'remote' | 'hybrid'
export type JobAIJobStatus = 'draft' | 'active' | 'expired'

export interface SalaryEvidence {
  source_name: string
  url: string
  country: string
  currency: string | null
  quoted_min: number | null
  quoted_max: number | null
  notes: string | null
}

export interface SalaryResearch {
  role: string
  country: string
  currency: string | null
  recommended_min: number | null
  recommended_max: number | null
  confidence: 'low' | 'medium' | 'high'
  rationale: string
  sources: SalaryEvidence[]
  insufficient_evidence: boolean
}

export interface JobAIDraftPayload {
  title: string
  location: string | null
  location_type: JobAILocationType
  salary_min: number | null
  salary_max: number | null
  currency: string | null
  status: JobAIJobStatus
  auto_shortlist: boolean
  shortlist_threshold: number
  required_years_of_experience: number | null
  overview: string
  responsibilities: string[]
  requirements: string[]
  preferred_qualifications: string[]
  benefits: string[]
  assumptions: string[]
  missing_fields: string[]
  warnings: string[]
}

export interface GenerateJobAIDraftRequest {
  title?: string
  rough_description?: string
  source_job_id?: string
  mode?: JobAIMode
  research_salary?: boolean
  locked_fields?: string[]
  manual?: boolean
}

export interface JobAIDecision {
  action: JobAIDecisionAction
  edited_fields?: Record<string, unknown>
  regenerate_fields?: string[]
  feedback?: string
  locked_fields?: string[]
}

export interface JobAIDraftRecord {
  id: string
  thread_id: string
  status: string
  mode: JobAIMode
  source_title: string | null
  source_rough_description: string | null
  locked_fields: string[]
  latest_draft: JobAIDraftPayload | null
  salary_research: SalaryResearch | null
  assumptions: string[]
  warnings: string[]
  missing_fields: string[]
  last_interrupt: Record<string, unknown> | null
  committed_job_id: string | null
  created_at: string
  updated_at: string
}

export interface CommitJobAIDraftRequest {
  status_override?: JobAIJobStatus
}

export interface CommitJobAIDraftResponse {
  draft: JobAIDraftRecord
  job: {
    id: string
    title: string
    status: string
  }
}

export const jobAiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobAIDrafts: builder.query<ApiResponse<JobAIDraftRecord[]>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/ai/drafts`,
      providesTags: ['JobAIDrafts'],
    }),

    createJobAIDraft: builder.mutation<ApiResponse<JobAIDraftRecord>, GenerateJobAIDraftRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/ai/draft`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['JobAIDrafts'],
    }),

    getJobAIDraft: builder.query<ApiResponse<JobAIDraftRecord>, string>({
      query: (draftId) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/ai/drafts/${draftId}`,
      providesTags: (_result, _error, draftId) => [{ type: 'JobAIDrafts', id: draftId }],
    }),

    respondToJobAIDraft: builder.mutation<
      ApiResponse<JobAIDraftRecord>,
      { draftId: string; decision: JobAIDecision }
    >({
      query: ({ draftId, decision }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/ai/drafts/${draftId}/respond`,
        method: 'POST',
        body: { decision },
      }),
      invalidatesTags: (_result, _error, { draftId }) => [{ type: 'JobAIDrafts', id: draftId }],
    }),

    commitJobAIDraft: builder.mutation<
      ApiResponse<CommitJobAIDraftResponse>,
      { draftId: string; payload?: CommitJobAIDraftRequest }
    >({
      query: ({ draftId, payload }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/ai/drafts/${draftId}/commit`,
        method: 'POST',
        body: payload ?? {},
      }),
      invalidatesTags: ['JobAIDrafts', 'Jobs'],
    }),

    deleteJobAIDraft: builder.mutation<ApiResponse<void>, string>({
      query: (draftId) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/ai/drafts/${draftId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['JobAIDrafts'],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
})

export const {
  useCommitJobAIDraftMutation,
  useCreateJobAIDraftMutation,
  useDeleteJobAIDraftMutation,
  useGetJobAIDraftsQuery,
  useGetJobAIDraftQuery,
  useLazyGetJobAIDraftQuery,
  useRespondToJobAIDraftMutation,
} = jobAiApi
