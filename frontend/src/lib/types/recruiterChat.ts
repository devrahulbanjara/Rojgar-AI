import type { ApiResponse } from '@/store/services/baseApi'

export type RecruiterChatUiType =
  | 'text'
  | 'candidate_list'
  | 'job_list'
  | 'salary_info'
  | 'candidate_detail'
  | 'job_edit_preview'
  | null

export interface ChatSessionResponse {
  id: string
  recruiter_id: string
  company_id: string
  thread_id: string
  title: string | null
  last_interaction_at: string | null
  created_at: string
  updated_at: string
}

export type ChatSessionsApiResponse = ApiResponse<ChatSessionResponse[]>
export type ChatSessionApiResponse = ApiResponse<ChatSessionResponse>
export type EmptyApiResponse = ApiResponse<null>

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  name?: string | null
  created_at?: string | null
}

export type ChatHistoryApiResponse = ApiResponse<ChatHistoryMessage[]>

export interface ChatInterruptPayload {
  type: 'job_edit_preview'
  proposal: JobEditPreviewData
}

export interface ChatExchangeResponse {
  history: ChatHistoryMessage[]
  interrupt: ChatInterruptPayload | null
}

export type ChatExchangeApiResponse = ApiResponse<ChatExchangeResponse>

export interface ToolResultEnvelope<TData = Record<string, unknown> | null> {
  tool: string
  ok: boolean
  text: string
  ui_type_hint: RecruiterChatUiType
  data: TData
}

export interface CandidateCardData {
  user_id: string
  application_id: string
  full_name: string
  avatar_url: string | null
  headline: string | null
  skills: string[]
  applied_for_job: string
  application_status: string
  score: number | null
  feedback: string | null
  match_score: number
}

export interface CandidateSearchResult {
  total: number
  candidates: CandidateCardData[]
}

export interface SalaryResearchSource {
  source_name: string
  url: string
  country: string
  currency: string | null
  quoted_min: number | null
  quoted_max: number | null
  notes: string | null
}

export interface SalaryResearchResult {
  role: string
  country: string
  currency: string | null
  recommended_min: number | null
  recommended_max: number | null
  confidence: 'low' | 'medium' | 'high'
  rationale: string
  insufficient_evidence: boolean
  year_context: string
  sources: SalaryResearchSource[]
}

export interface CompanyJobData {
  job_id: string
  title: string
  location: string | null
  location_type: string
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: string
  auto_shortlist: boolean
  expires_at: string | null
  overview: string | null
  responsibilities: string[]
  requirements: string[]
  preferred_qualifications: string[]
  benefits: string[]
  updated_at: string
}

export interface CompanyJobListResult {
  total: number
  jobs: CompanyJobData[]
}

export interface CandidateDetailData {
  user_id: string
  application_id: string
  job_id: string
  job_title: string
  full_name: string
  email: string
  avatar_url: string | null
  headline: string | null
  summary: string | null
  resume_name: string
  application_status: string
  score: number | null
  feedback: string | null
  applied_at: string
  updated_at: string
  skills: Array<{ id: string; skill_name: string }>
  experiences: Array<{
    id: string
    company_name: string
    title: string
    start_date: string | null
    end_date: string | null
    description: string[]
  }>
  educations: Array<{
    id: string
    institution: string
    degree: string | null
    field_of_study: string | null
    start_date: string | null
    end_date: string | null
  }>
}

export interface JobEditDiff {
  field: string
  before: unknown
  after: unknown
}

export interface JobEditPreviewData {
  job_id: string
  job_title: string
  summary: string
  patch: Record<string, unknown>
  diffs: JobEditDiff[]
}
