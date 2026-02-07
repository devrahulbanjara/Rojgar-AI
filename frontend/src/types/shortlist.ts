export interface SocialLink {
  social_link_id: string
  type: string
  url: string
}

export interface ShortlistCandidate {
  application_id: string
  job_id: string
  candidate_id: string
  name: string
  phone?: string
  picture?: string
  professional_headline?: string
  applied_at: string
  ai_score: number
  ai_analysis: string
  ai_recommendation: 'approve' | 'review' | 'reject'
  job_title: string
  social_links?: SocialLink[]
}

export interface ShortlistJob {
  job_id: string
  title: string
  department?: string
  applicant_count: number
  pending_ai_reviews: number
  candidates: ShortlistCandidate[]
  auto_shortlist?: boolean
}

export interface ShortlistFilters {
  scoreRange?: 'high' | 'medium' | 'low' | 'all'
  dateSort?: 'newest' | 'oldest'
  aiStatus?: 'recommended' | 'not_recommended' | 'all'
}
