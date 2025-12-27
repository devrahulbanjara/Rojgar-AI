/**
 * Job-related TypeScript type definitions
 * Centralized types for job management, applications, and related functionality
 */

// Job Types
export type JobLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
export type LocationType = 'Remote' | 'Hybrid' | 'On-site';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
export type JobStatus = 'Draft' | 'Active' | 'Inactive' | 'Closed';

export interface Company {
  id: number;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  location?: string;
  size?: string;
  industry?: string;
  brand_color?: string;
  founded_year?: number;
}

export interface Job {
  id: number;
  company_id: number;
  company?: Company;
  title: string;
  department: string;
  level: JobLevel;
  location: string;
  location_city?: string;
  location_country?: string;
  location_type: LocationType;
  employment_type: EmploymentType;
  salary_range?: {
    min: number;
    max: number;
    currency: string;
  };
  // Fallback fields if salary_range is not computed
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  description: string;
  requirements: string[];
  skills: string[];
  nice_to_have?: string[]; // Preferred qualifications (from AI agent)
  benefits: string[];
  posted_date: string;
  application_deadline: string;
  status: JobStatus;
  is_remote: boolean;
  is_featured: boolean;
  applicant_count: number;
  views_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JobFilters {
  search?: string;
}

export interface JobSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: 'posted_date' | 'salary';
  sort_order?: 'asc' | 'desc';
}

// Job API Response Types
export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface JobDetailResponse {
  job: Job;
  relatedJobs?: Job[];
}

// Job Form Types
export interface CreateJobRequest {
  title: string;
  company: string;
  locationCity: string;
  locationCountry: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requiredSkillsAndExperience: string[];
  niceToHave?: string[];
  level: JobLevel;
  department: string;
  deadline?: Date;
  mode?: 'manual' | 'agent';
  raw_requirements?: string;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: string;
}

// Job Draft Generation Types
export interface JobDraftGenerateRequest {
  title: string;
  raw_requirements: string;
  reference_jd?: string;
}

export interface JobDraftResponse {
  title: string;
  description: string;
  requiredSkillsAndExperience: string[];
  niceToHave: string[];
  benefits: string[];
  about_company?: string;
}

// Job Component Props Types
export interface JobCardProps {
  job: Job;
  onApply?: (job: Job) => void;
  onViewDetails?: (job: Job) => void;
  showApplyButton?: boolean;
  className?: string;
}

export interface JobListProps {
  jobs: Job[];
  loading?: boolean;
  error?: string;
  onJobClick?: (job: Job) => void;
  onApply?: (job: Job) => void;
  className?: string;
}

export interface JobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  onClearFilters: () => void;
  className?: string;
  compact?: boolean;
}

export interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (job: Job) => void;
  showApplyButton?: boolean;
}

// Job Hook Return Types
export interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export interface UseJobDetailReturn {
  job: Job | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
