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
  location_type: LocationType;
  employment_type: EmploymentType;
  salary_range: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  skills: string[];
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
  location?: string;
  department?: string;
  level?: JobLevel[];
  location_type?: LocationType[];
  employment_type?: EmploymentType[];
  salary_min?: number;
  salary_max?: number;
  is_remote?: boolean;
  is_featured?: boolean;
  company_id?: number;
}

export interface JobSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  department?: string;
  level?: JobLevel[];
  location_type?: LocationType[];
  employment_type?: EmploymentType[];
  salary_min?: number;
  salary_max?: number;
  is_remote?: boolean;
  is_featured?: boolean;
  company_id?: number;
  sort_by?: 'posted_date' | 'salary' | 'title' | 'company' | 'views_count' | 'applicant_count';
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
  location: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  skills: string[];
  level: JobLevel;
  department: string;
  deadline?: Date;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: string;
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
