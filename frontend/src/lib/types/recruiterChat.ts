import type { ApiResponse } from '@/store/services/baseApi'

export type RecruiterChatUiType =
  | 'text'
  | 'clarification'
  | 'salary_answer'
  | 'job_list'
  | 'job_edit_preview'
  | 'out_of_scope'
  | null

export interface ChatSessionArtifact {
  kind: 'salary_research' | 'job_edit' | 'job_query'
  title: string
  summary: string
  created_at: string
}

export interface ChatSessionResponse {
  id: string
  recruiter_id: string
  company_id: string
  thread_id: string
  title: string | null
  last_interaction_at: string | null
  created_at: string
  updated_at: string
  artifacts: ChatSessionArtifact[]
}

export type ChatSessionsApiResponse = ApiResponse<ChatSessionResponse[]>
export type ChatSessionApiResponse = ApiResponse<ChatSessionResponse>
export type EmptyApiResponse = ApiResponse<null>

export interface SourceItem {
  title: string
  url: string
  source_name?: string
  snippet?: string | null
  quoted_min?: number | null
  quoted_max?: number | null
  currency?: string | null
  notes?: string | null
}

export interface JobOption {
  job_id: string
  title: string
  location: string | null
  location_type: string | null
  status: string
  salary_min: number | null
  salary_max: number | null
  currency: string | null
  expires_at: string | null
}

export interface CompanyJobData {
  job_id: string
  title: string
  location: string | null
  location_type: string | null
  salary_min: number | null
  salary_max: number | null
  currency: string | null
  status: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface CompanyJobListResult {
  total: number
  jobs: CompanyJobData[]
  counts: Record<string, number>
}

export interface CandidateSearchResult {
  total: number
  candidates: Array<{
    user_id: string
    application_id: string
    avatar_url: string | null
    full_name: string
    applied_for_job: string
    application_status: string
    match_score: number
  }>
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
  sources: SourceItem[]
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

export interface RecruiterChatResponse {
  response_type: Exclude<RecruiterChatUiType, null>
  message: string
  data: Record<string, unknown> | null
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
  response_type: RecruiterChatUiType
  data: Record<string, unknown> | null
}

export interface PendingJobSelectionAction {
  type: 'job_selection'
  data: {
    kind: string
    request_text?: string
    options: JobOption[]
  }
}

export interface PendingJobEditAction {
  type: 'job_edit'
  data: JobEditPreviewData
}

export type PendingAction = PendingJobSelectionAction | PendingJobEditAction

export interface ChatHistoryResponse {
  history: ChatHistoryMessage[]
  pending_action: PendingAction | null
}

export interface ChatExchangeResponse {
  reply: RecruiterChatResponse
  history: ChatHistoryMessage[]
  pending_action: PendingAction | null
}

export type ChatHistoryApiResponse = ApiResponse<ChatHistoryResponse>
export type ChatExchangeApiResponse = ApiResponse<ChatExchangeResponse>

export type RecruiterChatStreamEvent =
  | { type: 'start'; data: { type: string } }
  | { type: 'token'; data: { content: string } }
  | { type: 'final'; data: ChatExchangeResponse }
  | { type: 'error'; data: { message: string } }
