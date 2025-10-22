/**
 * Job Service
 * Specialized service for job-related API operations with type safety
 */

import { apiClient } from '../lib/api';
import type { ApiResponse as BaseApiResponse } from '../types';
import type { 
  Job, 
  JobListResponse, 
  JobDetailResponse, 
  JobSearchParams, 
  CreateJobRequest,
  UpdateJobRequest,
} from '../types/job';
import type { Application, CreateApplicationRequest, UpdateApplicationRequest } from '../types/application';

// Job API endpoints
const jobEndpoints = {
  list: '/api/v1/jobs',
  recommendations: '/api/v1/jobs/recommendations',
  search: '/api/v1/jobs/search',
  detail: (id: string) => `/api/v1/jobs/${id}`,
  create: '/api/v1/jobs',
  update: (id: string) => `/api/v1/jobs/${id}`,
  delete: (id: string) => `/api/v1/jobs/${id}`,
} as const;

// Application API endpoints
const applicationEndpoints = {
  list: '/api/v1/applications',
  detail: (id: string) => `/api/v1/applications/${id}`,
  create: '/api/v1/applications',
  update: (id: string) => `/api/v1/applications/${id}`,
  delete: (id: string) => `/api/v1/applications/${id}`,
  byJob: (jobId: string) => `/api/v1/applications/job/${jobId}`,
  byCandidate: (candidateId: string) => `/api/v1/applications/candidate/${candidateId}`,
} as const;

// Job Service Class
export class JobService {
  /**
   * Get recommended jobs for homepage
   */
  static async getRecommendedJobs(limit: number = 5): Promise<Job[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    
    const endpoint = `${jobEndpoints.recommendations}?${queryParams.toString()}`;
    return apiClient.get<Job[]>(endpoint);
  }

  /**
   * Search jobs with filters and pagination
   */
  static async searchJobs(params?: JobSearchParams): Promise<JobListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    
    // Only search term
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = `${jobEndpoints.search}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<JobListResponse>(endpoint);
  }

  /**
   * Get list of jobs with optional filters and pagination (legacy method)
   * @deprecated Use searchJobs for filtered results or getRecommendedJobs for homepage
   */
  static async getJobs(params?: JobSearchParams): Promise<JobListResponse> {
    // For backward compatibility, redirect to searchJobs
    return JobService.searchJobs(params);
  }

  /**
   * Get job details by ID
   */
  static async getJobById(id: string): Promise<Job> {
    return apiClient.get<Job>(jobEndpoints.detail(id));
  }

  /**
   * Create a new job
   */
  static async createJob(data: CreateJobRequest): Promise<Job> {
    return apiClient.post<Job>(jobEndpoints.create, data);
  }

  /**
   * Update an existing job
   */
  static async updateJob(id: string, data: UpdateJobRequest): Promise<Job> {
    return apiClient.put<Job>(jobEndpoints.update(id), data);
  }

  /**
   * Delete a job
   */
  static async deleteJob(id: string): Promise<void> {
    return apiClient.delete<void>(jobEndpoints.delete(id));
  }


  /**
   * Get jobs by company
   */
  static async getJobsByCompany(companyId: string, params?: { page?: number; limit?: number }): Promise<JobListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('company_id', companyId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `${jobEndpoints.list}?${queryParams.toString()}`;
    return apiClient.get<JobListResponse>(endpoint);
  }

  /**
   * Get featured/recommended jobs
   */
  // Removed getFeaturedJobs as functionality is deprecated
}

// Application Service Class
export class ApplicationService {
  /**
   * Get list of applications
   */
  static async getApplications(params?: { 
    page?: number; 
    limit?: number; 
    jobId?: string; 
    candidateId?: string; 
    status?: string;
  }): Promise<Application[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.jobId) queryParams.append('id', params.jobId);
    if (params?.candidateId) queryParams.append('candidate_id', params.candidateId);
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = `${applicationEndpoints.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<Application[]>(endpoint);
  }

  /**
   * Get application details by ID
   */
  static async getApplicationById(id: string): Promise<Application> {
    return apiClient.get<Application>(applicationEndpoints.detail(id));
  }

  /**
   * Create a new application
   */
  static async createApplication(data: CreateApplicationRequest): Promise<Application> {
    return apiClient.post<Application>(applicationEndpoints.create, data);
  }

  /**
   * Update an existing application
   */
  static async updateApplication(id: string, data: UpdateApplicationRequest): Promise<Application> {
    return apiClient.put<Application>(applicationEndpoints.update(id), data);
  }

  /**
   * Delete an application
   */
  static async deleteApplication(id: string): Promise<void> {
    return apiClient.delete<void>(applicationEndpoints.delete(id));
  }

  /**
   * Get applications for a specific job
   */
  static async getApplicationsByJob(jobId: string, params?: { page?: number; limit?: number }): Promise<Application[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `${applicationEndpoints.byJob(jobId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<Application[]>(endpoint);
  }

  /**
   * Get applications for a specific candidate
   */
  static async getApplicationsByCandidate(candidateId: string, params?: { page?: number; limit?: number }): Promise<Application[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `${applicationEndpoints.byCandidate(candidateId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<Application[]>(endpoint);
  }
}

// Utility functions for job data transformation
export const jobUtils = {
  /**
   * Get salary range from job (handles both computed and raw fields)
   */
  getSalaryRange: (job: Job): { min: number; max: number; currency: string } | undefined => {
    if (job.salary_range) {
      return job.salary_range;
    }
    
    // Fallback to raw fields if salary_range is not computed
    if (job.salary_min !== undefined && job.salary_max !== undefined) {
      return {
        min: job.salary_min,
        max: job.salary_max,
        currency: job.salary_currency || 'USD',
      };
    }
    
    return undefined;
  },

  /**
   * Format salary range for display
   */
  formatSalaryRange: (salaryRange?: { min: number; max: number; currency: string }): string => {
    if (!salaryRange) {
      return 'Salary not specified';
    }
    
    const { min, max, currency } = salaryRange;
    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}K`;
      }
      return num.toString();
    };
    
    return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`;
  },

  /**
   * Format salary range for a job (convenience method)
   */
  formatJobSalary: (job: Job): string => {
    const salaryRange = jobUtils.getSalaryRange(job);
    return jobUtils.formatSalaryRange(salaryRange);
  },

  /**
   * Format posted date for display
   */
  formatPostedDate: (date: string | Date): string => {
    const now = new Date();
    const postedDate = new Date(date);
    const diffInMs = now.getTime() - postedDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  },

  /**
   * Get job level color for UI
   */
  getJobLevelColor: (level: string): string => {
    const colors = {
      'Intern': 'bg-blue-100 text-blue-800',
      'Entry': 'bg-green-100 text-green-800',
      'Mid': 'bg-yellow-100 text-yellow-800',
      'Senior': 'bg-orange-100 text-orange-800',
      'Lead': 'bg-purple-100 text-purple-800',
      'Executive': 'bg-red-100 text-red-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Get location type color for UI
   */
  getLocationTypeColor: (locationType: string): string => {
    const colors = {
      'Remote': 'bg-green-100 text-green-800',
      'Hybrid': 'bg-blue-100 text-blue-800',
      'On-site': 'bg-orange-100 text-orange-800',
    };
    return colors[locationType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Get employment type color for UI
   */
  getEmploymentTypeColor: (employmentType: string): string => {
    const colors = {
      'Full-time': 'bg-blue-100 text-blue-800',
      'Part-time': 'bg-green-100 text-green-800',
      'Contract': 'bg-yellow-100 text-yellow-800',
      'Freelance': 'bg-purple-100 text-purple-800',
      'Internship': 'bg-pink-100 text-pink-800',
    };
    return colors[employmentType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  },
};

// Export default instances
export const jobService = JobService;
export const applicationService = ApplicationService;
