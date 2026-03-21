import type { ApiResponse } from './baseApi'
import { baseApi } from './baseApi'

export type RecruiterChatUiType =
  | 'text'
  | 'candidate_list'
  | 'salary_info'
  | 'candidate_detail'
  | 'job_edit_preview'

export type RecruiterChatHistoryRole = 'user' | 'assistant' | 'tool'

export interface RecruiterChatSessionRecord {
  id: string
  recruiter_id: string
  company_id: string
  thread_id: string
  title: string | null
  last_interaction_at: string | null
  created_at: string
  updated_at: string
}

export interface RecruiterChatHistoryMessage {
  role: RecruiterChatHistoryRole
  content: string
  name?: string | null
  created_at?: string | null
}

export interface RecruiterChatAgentResponse {
  text: string
  ui_type: RecruiterChatUiType
  data: Record<string, unknown> | null
}

export interface RecruiterChatCandidateCard {
  user_id: string
  application_id?: string
  full_name: string
  avatar_url: string | null
  headline: string | null
  skills: string[]
  applied_for_job: string
  application_status: string
  score?: number | null
  feedback: string | null
  match_score: number
}

export interface RecruiterChatCandidateSearchPayload {
  total: number
  candidates: RecruiterChatCandidateCard[]
}

export interface RecruiterChatSalarySource {
  title?: string
  source_name?: string
  url: string
}

export interface RecruiterChatSalaryPayload {
  role: string
  country: string
  currency: string | null
  min?: number | null
  max?: number | null
  median?: number | null
  recommended_min?: number | null
  recommended_max?: number | null
  confidence: 'low' | 'medium' | 'high'
  year_context?: string
  rationale?: string
  sources: RecruiterChatSalarySource[]
}

export interface RecruiterChatCandidateDetailPayload {
  user_id?: string
  application_id?: string
  job_id?: string
  job_title?: string
  full_name: string
  email?: string
  avatar_url: string | null
  headline: string | null
  summary: string | null
  application_status: string
  score: number | null
  feedback: string | null
  skills: Array<{ id?: string; skill_name: string }> | string[]
  experiences: Array<{
    id?: string
    company_name: string
    title: string
    start_date?: string | null
    end_date?: string | null
    description?: string[]
  }>
  educations: Array<{
    id?: string
    institution: string
    degree?: string | null
    field_of_study?: string | null
    start_date?: string | null
    end_date?: string | null
  }>
  resume_name: string
  applied_at: string
}

export interface RecruiterChatJobEditDiff {
  field: string
  before: string | number | boolean | string[] | null
  after: string | number | boolean | string[] | null
}

export interface RecruiterChatJobEditProposal {
  job_id: string
  job_title?: string
  summary?: string
  patch?: Record<string, unknown>
  diffs?: RecruiterChatJobEditDiff[]
}

export interface RecruiterChatToolEnvelope {
  tool?: string
  ok?: boolean
  text?: string
  ui_type_hint?: RecruiterChatUiType
  data?: unknown
}

export const recruiterChatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRecruiterChatSession: builder.mutation<ApiResponse<RecruiterChatSessionRecord>, void>({
      query: () => ({
        url: '/api/recruiter-chat/sessions',
        method: 'POST',
      }),
    }),

    getRecruiterChatHistory: builder.query<ApiResponse<RecruiterChatHistoryMessage[]>, string>({
      query: (sessionId) => `/api/recruiter-chat/sessions/${sessionId}/history`,
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
})

export const {
  useCreateRecruiterChatSessionMutation,
  useLazyGetRecruiterChatHistoryQuery,
} = recruiterChatApi
