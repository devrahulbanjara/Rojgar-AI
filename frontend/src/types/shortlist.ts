export interface ShortlistCandidate {
  application_id: string
  candidate_id: string
  name: string
  email: string
  phone?: string
  picture?: string
  professional_headline?: string
  applied_at: string
  ai_score: number
  ai_analysis: string
  ai_recommendation: 'approve' | 'review' | 'reject'
  job_title: string
}

export interface ShortlistJob {
  job_id: string
  title: string
  department?: string
  applicant_count: number
  pending_ai_reviews: number
  candidates: ShortlistCandidate[]
}

export interface ShortlistFilters {
  scoreRange?: 'high' | 'medium' | 'low' | 'all'
  dateSort?: 'newest' | 'oldest'
  aiStatus?: 'recommended' | 'not_recommended' | 'all'
}
