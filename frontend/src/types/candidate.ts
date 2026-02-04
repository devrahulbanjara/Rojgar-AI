export interface CandidateApplication {
  application_id: string
  job_id: string
  job_title: string
  candidate_id: string
  name: string
  email: string
  phone?: string
  picture?: string
  professional_headline?: string
  professional_summary?: string
  current_status: 'applied' | 'interviewing' | 'outcome'
  applied_at: string
  ai_score?: number
  ai_analysis?: string
}

export interface CandidateListResponse {
  candidates: CandidateApplication[]
  total: number
}

export interface CandidateFilters {
  status?: string
  job_id?: string
  search?: string
}