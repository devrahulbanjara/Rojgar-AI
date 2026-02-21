export type JobLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal'
export type LocationType = 'Remote' | 'Hybrid' | 'On-site'
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
export type JobStatus = 'Draft' | 'Active' | 'Expired'

export interface Company {
  id: number
  name: string
  logo?: string
  website?: string
  description?: string
  location?: string
  size?: string
  industry?: string
  brand_color?: string
  founded_year?: number
}

export interface Job {
  id: number
  job_id?: string
  company_id: number
  company?: Company
  title: string
  department: string
  level: JobLevel
  location: string
  location_city?: string
  location_country?: string
  location_type: LocationType
  employment_type: EmploymentType
  salary_range?: {
    min: number
    max: number
    currency: string
  }
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  description: string
  requirements: string[]
  skills: string[]
  nice_to_have?: string[]
  benefits: string[]
  posted_date: string
  application_deadline: string
  status: JobStatus
  is_remote: boolean
  is_featured: boolean
  applicant_count: number
  views_count: number
  created_by: string
  created_at: string
  updated_at: string
  auto_shortlist?: boolean
  shortlist_threshold?: number
  shortlist_status?: string
  final_shortlist_completed?: boolean
}

export interface JobFilters {
  search?: string
}

export interface JobSearchParams {
  page?: number
  limit?: number
  search?: string
  sort_by?: 'posted_date' | 'salary'
  sort_order?: 'asc' | 'desc'
}

export interface JobListResponse {
  jobs: Job[]
  total: number
  page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface JobDetailResponse {
  job: Job
  relatedJobs?: Job[]
}

export interface CreateJobRequest {
  title: string
  company?: string
  department?: string
  level?: string

  job_summary: string
  job_responsibilities: string[]
  required_qualifications: string[]
  preferred: string[]
  compensation_and_benefits: string[]

  location_city?: string
  location_country?: string
  location_type?: string
  employment_type?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  application_deadline?: string

  raw_requirements?: string
  status?: 'draft' | 'active'
  auto_shortlist: boolean
  shortlist_threshold?: number
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: string
}

export interface JobDraftGenerateRequest {
  title: string
  raw_requirements: string
  reference_jd_id: string | null
  current_draft?: {
    job_summary: string
    job_responsibilities: string[]
    required_qualifications: string[]
    preferred: string[]
    compensation_and_benefits: string[]
  } | null
}

export interface JobDraftResponse {
  job_summary?: string
  job_responsibilities?: string[]
  required_qualifications?: string[]
  preferred?: string[]
  compensation_and_benefits?: string[]
}

export interface JobCardProps {
  job: Job
  onApply?: (job: Job) => void
  onViewDetails?: (job: Job) => void
  showApplyButton?: boolean
  className?: string
}

export interface JobListProps {
  jobs: Job[]
  loading?: boolean
  error?: string
  onJobClick?: (job: Job) => void
  onApply?: (job: Job) => void
  className?: string
}

export interface JobFiltersProps {
  filters: JobFilters
  onFiltersChange: (filters: JobFilters) => void
  onClearFilters: () => void
  className?: string
  compact?: boolean
}

export interface JobDetailsModalProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
  onApply?: (job: Job) => void
  showApplyButton?: boolean
}

export interface UseJobsReturn {
  jobs: Job[]
  loading: boolean
  error: string | null
  total: number
  page: number
  totalPages: number
  refetch: () => void
  loadMore: () => void
  hasMore: boolean
}

export interface UseJobDetailReturn {
  job: Job | null
  loading: boolean
  error: string | null
  refetch: () => void
}
