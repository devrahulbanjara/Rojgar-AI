/**
 * Enhanced API Service Layer
 * Centralized API client with error handling, interceptors, and type safety
 */

import { API_BASE_URL } from '../config/constants';
import type { ApiResponse } from '../types';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Always include cookies for authentication
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        error
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Utility methods
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  setHeader(key: string, value: string) {
    this.defaultHeaders[key] = value;
  }

  removeHeader(key: string) {
    delete this.defaultHeaders[key];
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// API endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    googleCallback: '/auth/google/callback',
    selectRole: '/auth/select-role',
    me: '/users/me',
  },
  
  // User endpoints
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  
  // Dashboard endpoints
  dashboard: {
    stats: '/dashboard/stats',
    recentActivity: '/dashboard/activity',
  },
  
  // Job endpoints
  jobs: {
    list: '/jobs',
    recommendations: '/jobs/recommendations',
    search: '/jobs/search',
    detail: (id: string) => `/jobs/${id}`,
    create: '/jobs',
    update: (id: string) => `/jobs/${id}`,
    delete: (id: string) => `/jobs/${id}`,
  },
  
  // Application endpoints
  applications: {
    list: '/applications',
    detail: (id: string) => `/applications/${id}`,
    create: '/applications',
    update: (id: string) => `/applications/${id}`,
    delete: (id: string) => `/applications/${id}`,
    byJob: (jobId: string) => `/applications/job/${jobId}`,
    byCandidate: (candidateId: string) => `/applications/candidate/${candidateId}`,
    trackingBoard: '/applications/tracking-board',
    stats: '/applications/stats',
  },
  
  // Profile endpoints (SSOT - Single Source of Truth)
  profile: {
    get: '/api/v1/profile',
    create: '/api/v1/profile',
    update: '/api/v1/profile',
    workExperience: {
      list: '/api/v1/profile/work-experience',
      create: '/api/v1/profile/work-experience',
      update: (id: string) => `/api/v1/profile/work-experience/${id}`,
      delete: (id: string) => `/api/v1/profile/work-experience/${id}`,
    },
    education: {
      list: '/api/v1/profile/education',
      create: '/api/v1/profile/education',
      update: (id: string) => `/api/v1/profile/education/${id}`,
      delete: (id: string) => `/api/v1/profile/education/${id}`,
    },
    certifications: {
      list: '/api/v1/profile/certifications',
      create: '/api/v1/profile/certifications',
      update: (id: string) => `/api/v1/profile/certifications/${id}`,
      delete: (id: string) => `/api/v1/profile/certifications/${id}`,
    },
    skills: {
      list: '/api/v1/profile/skills',
      create: '/api/v1/profile/skills',
      update: (id: string) => `/api/v1/profile/skills/${id}`,
      delete: (id: string) => `/api/v1/profile/skills/${id}`,
    },
  },
  
  // Resume endpoints (Tailored views)
  resumes: {
    list: '/api/v1/resumes',
    detail: (id: string) => `/api/v1/resumes/${id}`,
    create: '/api/v1/resumes',
    update: (id: string) => `/api/v1/resumes/${id}`,
    delete: (id: string) => `/api/v1/resumes/${id}`,
    autofillData: '/api/v1/resumes/autofill-data',
    experiences: {
      add: (resumeId: string) => `/api/v1/resumes/${resumeId}/experiences`,
      update: (resumeId: string, expId: string) => `/api/v1/resumes/${resumeId}/experiences/${expId}`,
      remove: (resumeId: string, expId: string) => `/api/v1/resumes/${resumeId}/experiences/${expId}`,
    },
    education: {
      add: (resumeId: string) => `/api/v1/resumes/${resumeId}/education`,
      remove: (resumeId: string, eduId: string) => `/api/v1/resumes/${resumeId}/education/${eduId}`,
    },
    certifications: {
      add: (resumeId: string) => `/api/v1/resumes/${resumeId}/certifications`,
      remove: (resumeId: string, certId: string) => `/api/v1/resumes/${resumeId}/certifications/${certId}`,
    },
    skills: {
      add: (resumeId: string) => `/api/v1/resumes/${resumeId}/skills`,
      remove: (resumeId: string, skillId: string) => `/api/v1/resumes/${resumeId}/skills/${skillId}`,
    },
  },
} as const;

// Type-safe API methods
export const api = {
  // Auth methods
  auth: {
    login: (credentials: any) => apiClient.post(endpoints.auth.login, credentials),
    signup: (data: any) => apiClient.post(endpoints.auth.signup, data),
    logout: () => apiClient.post(endpoints.auth.logout),
    selectRole: (role: string) => apiClient.post(endpoints.auth.selectRole, { role }),
    getCurrentUser: () => apiClient.get(endpoints.auth.me),
  },
  
  // User methods
  users: {
    list: (params?: Record<string, any>) => 
      apiClient.get(`${endpoints.users.list}${params ? `?${new URLSearchParams(params)}` : ''}`),
    get: (id: string) => apiClient.get(endpoints.users.detail(id)),
    update: (id: string, data: any) => apiClient.put(endpoints.users.update(id), data),
    delete: (id: string) => apiClient.delete(endpoints.users.delete(id)),
  },
  
  // Dashboard methods
  dashboard: {
    getStats: () => apiClient.get(endpoints.dashboard.stats),
    getRecentActivity: () => apiClient.get(endpoints.dashboard.recentActivity),
  },
  
  // Job methods
  jobs: {
    list: (params?: Record<string, any>) => 
      apiClient.get(`${endpoints.jobs.list}${params ? `?${new URLSearchParams(params)}` : ''}`),
    recommendations: (params?: Record<string, any>) => 
      apiClient.get(`${endpoints.jobs.recommendations}${params ? `?${new URLSearchParams(params)}` : ''}`),
    search: (params?: Record<string, any>) => 
      apiClient.get(`${endpoints.jobs.search}${params ? `?${new URLSearchParams(params)}` : ''}`),
    get: (id: string) => apiClient.get(endpoints.jobs.detail(id)),
    create: (data: any) => apiClient.post(endpoints.jobs.create, data),
    update: (id: string, data: any) => apiClient.put(endpoints.jobs.update(id), data),
    delete: (id: string) => apiClient.delete(endpoints.jobs.delete(id)),
  },
  
  // Application methods
  applications: {
    list: (params?: Record<string, any>) => 
      apiClient.get(`${endpoints.applications.list}${params ? `?${new URLSearchParams(params)}` : ''}`),
    get: (id: string) => apiClient.get(endpoints.applications.detail(id)),
    create: (data: any) => apiClient.post(endpoints.applications.create, data),
    update: (id: string, data: any) => apiClient.put(endpoints.applications.update(id), data),
    delete: (id: string) => apiClient.delete(endpoints.applications.delete(id)),
    getByJob: (jobId: string) => apiClient.get(endpoints.applications.byJob(jobId)),
    getByCandidate: (candidateId: string) => apiClient.get(endpoints.applications.byCandidate(candidateId)),
    getTrackingBoard: () => apiClient.get(endpoints.applications.trackingBoard),
    getStats: () => apiClient.get(endpoints.applications.stats),
  },
  
  // Profile methods (SSOT - Single Source of Truth)
  profile: {
    get: () => apiClient.get(endpoints.profile.get),
    create: (data: any) => apiClient.post(endpoints.profile.create, data),
    update: (data: any) => apiClient.put(endpoints.profile.update, data),
    workExperience: {
      list: () => apiClient.get(endpoints.profile.workExperience.list),
      create: (data: any) => apiClient.post(endpoints.profile.workExperience.create, data),
      update: (id: string, data: any) => apiClient.put(endpoints.profile.workExperience.update(id), data),
      delete: (id: string) => apiClient.delete(endpoints.profile.workExperience.delete(id)),
    },
    education: {
      list: () => apiClient.get(endpoints.profile.education.list),
      create: (data: any) => apiClient.post(endpoints.profile.education.create, data),
      update: (id: string, data: any) => apiClient.put(endpoints.profile.education.update(id), data),
      delete: (id: string) => apiClient.delete(endpoints.profile.education.delete(id)),
    },
    certifications: {
      list: () => apiClient.get(endpoints.profile.certifications.list),
      create: (data: any) => apiClient.post(endpoints.profile.certifications.create, data),
      update: (id: string, data: any) => apiClient.put(endpoints.profile.certifications.update(id), data),
      delete: (id: string) => apiClient.delete(endpoints.profile.certifications.delete(id)),
    },
    skills: {
      list: () => apiClient.get(endpoints.profile.skills.list),
      create: (data: any) => apiClient.post(endpoints.profile.skills.create, data),
      update: (id: string, data: any) => apiClient.put(endpoints.profile.skills.update(id), data),
      delete: (id: string) => apiClient.delete(endpoints.profile.skills.delete(id)),
    },
  },
  
  // Resume methods (Tailored views)
  resumes: {
    list: () => apiClient.get(endpoints.resumes.list),
    get: (id: string) => apiClient.get(endpoints.resumes.detail(id)),
    create: (data: any) => apiClient.post(endpoints.resumes.create, data),
    update: (id: string, data: any) => apiClient.put(endpoints.resumes.update(id), data),
    delete: (id: string) => apiClient.delete(endpoints.resumes.delete(id)),
    getAutofillData: () => apiClient.get(endpoints.resumes.autofillData),
    experiences: {
      add: (resumeId: string, data: any) => apiClient.post(endpoints.resumes.experiences.add(resumeId), data),
      update: (resumeId: string, expId: string, data: any) => apiClient.put(endpoints.resumes.experiences.update(resumeId, expId), data),
      remove: (resumeId: string, expId: string) => apiClient.delete(endpoints.resumes.experiences.remove(resumeId, expId)),
    },
    education: {
      add: (resumeId: string, data: any) => apiClient.post(endpoints.resumes.education.add(resumeId), data),
      remove: (resumeId: string, eduId: string) => apiClient.delete(endpoints.resumes.education.remove(resumeId, eduId)),
    },
    certifications: {
      add: (resumeId: string, data: any) => apiClient.post(endpoints.resumes.certifications.add(resumeId), data),
      remove: (resumeId: string, certId: string) => apiClient.delete(endpoints.resumes.certifications.remove(resumeId, certId)),
    },
    skills: {
      add: (resumeId: string, data: any) => apiClient.post(endpoints.resumes.skills.add(resumeId), data),
      remove: (resumeId: string, skillId: string) => apiClient.delete(endpoints.resumes.skills.remove(resumeId, skillId)),
    },
  },
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Request/response interceptors
export const setupApiInterceptors = () => {
  // You can add global request/response interceptors here
  // For example, automatic token refresh, request logging, etc.
  
  // Example: Log all requests in development
  if (process.env.NODE_ENV === 'development') {
    const originalRequest = apiClient.request.bind(apiClient);
    apiClient.request = async function<T>(endpoint: string, options: RequestInit = {}) {
      console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, options);
      const response = await originalRequest<T>(endpoint, options);
      console.log(`API Response: ${endpoint}`, response);
      return response;
    };
  }
};

// Initialize interceptors
setupApiInterceptors();
