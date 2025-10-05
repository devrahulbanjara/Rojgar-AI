/**
 * Job Service
 * Specialized service for job-related API operations with type safety
 */

import { apiClient } from './api';
import type { ApiResponse as BaseApiResponse } from './api';
import type { 
  Job, 
  JobListResponse, 
  JobDetailResponse, 
  JobSearchParams, 
  CreateJobRequest,
  UpdateJobRequest,
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from '../types/job';

// Job API endpoints
const jobEndpoints = {
  list: '/jobs',
  detail: (id: string) => `/jobs/${id}`,
  create: '/jobs',
  update: (id: string) => `/jobs/${id}`,
  delete: (id: string) => `/jobs/${id}`,
  search: '/jobs/search',
} as const;

// Application API endpoints
const applicationEndpoints = {
  list: '/applications',
  detail: (id: string) => `/applications/${id}`,
  create: '/applications',
  update: (id: string) => `/applications/${id}`,
  delete: (id: string) => `/applications/${id}`,
  byJob: (jobId: string) => `/applications/job/${jobId}`,
  byCandidate: (candidateId: string) => `/applications/candidate/${candidateId}`,
} as const;

// Job Service Class
export class JobService {
  /**
   * Get list of jobs with optional filters and pagination
   */
  static async getJobs(params?: JobSearchParams): Promise<BaseApiResponse<JobListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    
    // Add filters
    if (params?.search) queryParams.append('search', params.search);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.location_type?.length) {
      params.location_type.forEach(type => queryParams.append('location_type', type));
    }
    if (params?.employment_type?.length) {
      params.employment_type.forEach(type => queryParams.append('employment_type', type));
    }
    if (params?.level?.length) {
      params.level.forEach(level => queryParams.append('level', level));
    }
    if (params?.salary_min) queryParams.append('salary_min', params.salary_min.toString());
    if (params?.salary_max) queryParams.append('salary_max', params.salary_max.toString());
    if (params?.is_remote !== undefined) queryParams.append('is_remote', params.is_remote.toString());
    if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString());
    
    const endpoint = `${jobEndpoints.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<JobListResponse>(endpoint);
  }

  /**
   * Get job details by ID
   */
  static async getJobById(id: string): Promise<BaseApiResponse<JobDetailResponse>> {
    return apiClient.get<JobDetailResponse>(jobEndpoints.detail(id));
  }

  /**
   * Create a new job
   */
  static async createJob(data: CreateJobRequest): Promise<BaseApiResponse<Job>> {
    return apiClient.post<Job>(jobEndpoints.create, data);
  }

  /**
   * Update an existing job
   */
  static async updateJob(id: string, data: UpdateJobRequest): Promise<BaseApiResponse<Job>> {
    return apiClient.put<Job>(jobEndpoints.update(id), data);
  }

  /**
   * Delete a job
   */
  static async deleteJob(id: string): Promise<BaseApiResponse<void>> {
    return apiClient.delete<void>(jobEndpoints.delete(id));
  }

  /**
   * Search jobs with advanced filters
   */
  static async searchJobs(searchParams: JobSearchParams): Promise<BaseApiResponse<JobListResponse>> {
    return apiClient.post<JobListResponse>(jobEndpoints.search, searchParams);
  }

  /**
   * Get jobs by company
   */
  static async getJobsByCompany(companyId: string, params?: { page?: number; limit?: number }): Promise<BaseApiResponse<JobListResponse>> {
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
  static async getFeaturedJobs(limit: number = 10): Promise<BaseApiResponse<Job[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('featured', 'true');
    queryParams.append('limit', limit.toString());
    
    const endpoint = `${jobEndpoints.list}?${queryParams.toString()}`;
    return apiClient.get<Job[]>(endpoint);
  }
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
  }): Promise<BaseApiResponse<{ applications: Application[]; total: number; page: number; totalPages: number }>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.jobId) queryParams.append('job_id', params.jobId);
    if (params?.candidateId) queryParams.append('candidate_id', params.candidateId);
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = `${applicationEndpoints.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get(endpoint);
  }

  /**
   * Get application details by ID
   */
  static async getApplicationById(id: string): Promise<BaseApiResponse<Application>> {
    return apiClient.get<Application>(applicationEndpoints.detail(id));
  }

  /**
   * Create a new application
   */
  static async createApplication(data: CreateApplicationRequest): Promise<BaseApiResponse<Application>> {
    return apiClient.post<Application>(applicationEndpoints.create, data);
  }

  /**
   * Update an existing application
   */
  static async updateApplication(id: string, data: UpdateApplicationRequest): Promise<BaseApiResponse<Application>> {
    return apiClient.put<Application>(applicationEndpoints.update(id), data);
  }

  /**
   * Delete an application
   */
  static async deleteApplication(id: string): Promise<BaseApiResponse<void>> {
    return apiClient.delete<void>(applicationEndpoints.delete(id));
  }

  /**
   * Get applications for a specific job
   */
  static async getApplicationsByJob(jobId: string, params?: { page?: number; limit?: number }): Promise<BaseApiResponse<Application[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `${applicationEndpoints.byJob(jobId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<Application[]>(endpoint);
  }

  /**
   * Get applications for a specific candidate
   */
  static async getApplicationsByCandidate(candidateId: string, params?: { page?: number; limit?: number }): Promise<BaseApiResponse<Application[]>> {
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
   * Format salary range for display
   */
  formatSalaryRange: (salaryRange: { min: number; max: number; currency: string }): string => {
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
