import { apiClient } from '../lib/api'
import type {
  Job,
  JobListResponse,
  JobSearchParams,
  CreateJobRequest,
  UpdateJobRequest,
  JobDraftGenerateRequest,
  JobDraftResponse,
} from '../types/job'
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from '../types/application'

const jobEndpoints = {
  list: '/api/v1/jobs',
  recommendations: '/api/v1/jobs/recommendations',
  search: '/api/v1/jobs/search',
  detail: (id: string) => `/api/v1/jobs/${id}`,
  create: '/api/v1/recruiter/jobs',
  generateDraft: '/api/v1/recruiter/jobs/generate-draft',
  update: (id: string) => `/api/v1/recruiter/jobs/${id}`,
  delete: (id: string) => `/api/v1/recruiter/jobs/${id}`,
  expire: (id: string) => `/api/v1/recruiter/jobs/${id}/expire`,
} as const

const applicationEndpoints = {
  list: '/api/v1/candidate/applications',
  detail: (id: string) => `/api/v1/candidate/applications/${id}`,
  create: '/api/v1/candidate/applications',
  update: (id: string) => `/api/v1/candidate/applications/${id}`,
  delete: (id: string) => `/api/v1/candidate/applications/${id}`,
  byJob: (jobId: string) => `/api/v1/candidate/applications/job/${jobId}`,
  byCandidate: (candidateId: string) => `/api/v1/candidate/applications/candidate/${candidateId}`,
} as const

export class JobService {
  static async getPersonalizedRecommendations(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters?: {
      employmentType?: string
      locationType?: string
    }
  ): Promise<JobListResponse> {
    const queryParams = new URLSearchParams()
    queryParams.append('page', page.toString())
    queryParams.append('limit', limit.toString())

    if (filters?.employmentType) {
      queryParams.append('employment_type', filters.employmentType)
    }
    if (filters?.locationType) {
      queryParams.append('location_type', filters.locationType)
    }

    const endpoint = `${jobEndpoints.recommendations}?${queryParams.toString()}`
    return apiClient.get<JobListResponse>(endpoint)
  }

  static async getRecommendedJobs(limit: number = 5): Promise<Job[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('limit', limit.toString())

    const endpoint = `${jobEndpoints.recommendations}?${queryParams.toString()}`
    return apiClient.get<Job[]>(endpoint)
  }

  static async searchJobs(
    params?: JobSearchParams & {
      employmentType?: string
      locationType?: string
    }
  ): Promise<JobListResponse> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

    if (params?.search) queryParams.append('q', params.search)

    if (params?.employmentType) {
      queryParams.append('employment_type', params.employmentType)
    }
    if (params?.locationType) {
      queryParams.append('location_type', params.locationType)
    }

    const endpoint = `${jobEndpoints.search}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<JobListResponse>(endpoint)
  }

  static async getJobs(params?: JobSearchParams): Promise<JobListResponse> {
    return JobService.searchJobs(params)
  }

  static async getJobById(id: string): Promise<Job> {
    return apiClient.get<Job>(jobEndpoints.detail(id))
  }

  static async generateJobDraft(data: JobDraftGenerateRequest): Promise<JobDraftResponse> {
    return apiClient.post<JobDraftResponse>(jobEndpoints.generateDraft, data)
  }

  static async createJob(data: CreateJobRequest): Promise<Job> {
    return apiClient.post<Job>(jobEndpoints.create, data)
  }

  static async updateJob(id: string, data: UpdateJobRequest): Promise<Job> {
    return apiClient.put<Job>(jobEndpoints.update(id), data)
  }

  static async expireJob(id: string): Promise<Job> {
    return apiClient.post<Job>(jobEndpoints.expire(id), {})
  }

  static async deleteJob(id: string): Promise<void> {
    return apiClient.delete<void>(jobEndpoints.delete(id))
  }

  static async getJobsByCompany(
    userId: string,
    params?: { organizationId?: string; page?: number; limit?: number }
  ): Promise<JobListResponse> {
    const queryParams = new URLSearchParams()
    if (userId) queryParams.append('user_id', userId)
    if (params?.organizationId) queryParams.append('organization_id', params.organizationId)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = `${jobEndpoints.list}?${queryParams.toString()}`
    return apiClient.get<JobListResponse>(endpoint)
  }
}

export class ApplicationService {
  static async getApplications(params?: {
    page?: number
    limit?: number
    jobId?: string
    candidateId?: string
    status?: string
  }): Promise<Application[]> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.jobId) queryParams.append('id', params.jobId)
    if (params?.candidateId) queryParams.append('candidate_id', params.candidateId)
    if (params?.status) queryParams.append('status', params.status)

    const endpoint = `${applicationEndpoints.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<Application[]>(endpoint)
  }

  static async getApplicationById(id: string): Promise<Application> {
    return apiClient.get<Application>(applicationEndpoints.detail(id))
  }

  static async createApplication(data: CreateApplicationRequest): Promise<Application> {
    return apiClient.post<Application>(applicationEndpoints.create, data)
  }

  static async updateApplication(id: string, data: UpdateApplicationRequest): Promise<Application> {
    return apiClient.put<Application>(applicationEndpoints.update(id), data)
  }

  static async deleteApplication(id: string): Promise<void> {
    return apiClient.delete<void>(applicationEndpoints.delete(id))
  }

  static async getApplicationsByJob(
    jobId: string,
    params?: { page?: number; limit?: number }
  ): Promise<Application[]> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = `${applicationEndpoints.byJob(jobId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<Application[]>(endpoint)
  }

  static async getApplicationsByCandidate(
    candidateId: string,
    params?: { page?: number; limit?: number }
  ): Promise<Application[]> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = `${applicationEndpoints.byCandidate(candidateId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<Application[]>(endpoint)
  }
}

export const jobUtils = {
  getSalaryRange: (job: Job): { min: number; max: number; currency: string } | undefined => {
    if (job.salary_range) {
      return job.salary_range
    }

    if (job.salary_min !== undefined && job.salary_max !== undefined) {
      return {
        min: job.salary_min,
        max: job.salary_max,
        currency: job.salary_currency || 'USD',
      }
    }

    return undefined
  },

  formatSalaryRange: (salaryRange?: { min: number; max: number; currency: string }): string => {
    if (!salaryRange) {
      return 'Salary not specified'
    }

    const { min, max, currency } = salaryRange
    const formatNumber = (num: number | null | undefined) => {
      if (num === null || num === undefined) return '0'
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}K`
      }
      return num.toString()
    }

    return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`
  },

  formatJobSalary: (job: Job): string => {
    const salaryRange = jobUtils.getSalaryRange(job)
    return jobUtils.formatSalaryRange(salaryRange)
  },

  formatPostedDate: (date: string | Date): string => {
    if (!date) return 'Recently'

    const postedDate = new Date(date)
    const now = new Date()

    if (isNaN(postedDate.getTime())) return 'Recently'

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const posted = new Date(postedDate.getFullYear(), postedDate.getMonth(), postedDate.getDate())

    const diffInMs = today.getTime() - posted.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} month${months > 1 ? 's' : ''} ago`
    } else {
      const years = Math.floor(diffInDays / 365)
      return `${years} year${years > 1 ? 's' : ''} ago`
    }
  },

  getJobLevelColor: (level: string): string => {
    const colors = {
      Intern: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      Entry: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      Mid: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      Senior: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      Lead: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      Executive: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    }
    return colors[level as keyof typeof colors] || 'bg-background-subtle text-text-primary'
  },

  getLocationTypeColor: (locationType: string): string => {
    const colors = {
      Remote: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      Hybrid: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'On-site': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    }
    return colors[locationType as keyof typeof colors] || 'bg-background-subtle text-text-primary'
  },

  getEmploymentTypeColor: (employmentType: string): string => {
    const colors = {
      'Full-time': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'Part-time': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      Contract: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      Freelance: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      Internship: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
    }
    return colors[employmentType as keyof typeof colors] || 'bg-background-subtle text-text-primary'
  },
}

export const jobService = JobService
export const applicationService = ApplicationService
