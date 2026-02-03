import { API_BASE_URL } from '../config/constants'

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private onUnauthorized?: () => void

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Always include cookies for authentication
    }

    try {
      const response = await fetch(url, config)

      if (response.status === 204) {
        return null as T
      }

      if (response.status === 401) {
        if (this.onUnauthorized) {
          this.onUnauthorized()
        }
        throw new ApiError('Authentication required. Please log in again.', response.status, null)
      }

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        if (data) {
          if (typeof data === 'string') {
            errorMessage = data
          } else if (typeof data === 'object') {
            if (data.message) {
              errorMessage = data.message
            } else if (data.detail) {
              if (typeof data.detail === 'string') {
                errorMessage = data.detail
              } else {
                errorMessage = JSON.stringify(data.detail)
              }
            } else {
              errorMessage = JSON.stringify(data)
            }
          }
        }

        throw new ApiError(errorMessage, response.status, data)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(error instanceof Error ? error.message : 'Network error', 0, error)
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization']
  }

  setHeader(key: string, value: string) {
    this.defaultHeaders[key] = value
  }

  removeHeader(key: string) {
    delete this.defaultHeaders[key]
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

export const endpoints = {
  auth: {
    login: '/api/v1/auth/login',
    signup: '/api/v1/auth/signup',
    logout: '/api/v1/auth/logout',
    googleCallback: '/api/v1/auth/google/callback',
    selectRole: '/api/v1/auth/select-role',
    me: '/api/v1/users/me',
  },

  users: {
    list: '/api/v1/users',
    detail: (id: string) => `/api/v1/users/${id}`,
    update: (id: string) => `/api/v1/users/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
  },

  dashboard: {
    // Note: Dashboard stats are fetched via useDashboardStats hook which calls multiple endpoints
    // This endpoint definition is kept for backward compatibility but may not be used
    stats: '/api/v1/recruiter/stats/active-jobs',
    recentActivity: '/api/v1/recruiter/stats/recent-activity',
  },

  jobs: {
    list: '/api/v1/jobs',
    recommendations: '/api/v1/jobs/recommendations',
    search: '/api/v1/jobs/search',
    detail: (id: string) => `/api/v1/jobs/${id}`,
    create: '/api/v1/recruiter/jobs',
    generateDraft: '/api/v1/recruiter/jobs/generate-draft',
    update: (id: string) => `/api/v1/recruiter/jobs/${id}`,
    delete: (id: string) => `/api/v1/recruiter/jobs/${id}`,
    expire: (id: string) => `/api/v1/recruiter/jobs/${id}/expire`,
  },

  applications: {
    list: '/api/v1/candidate/applications',
    detail: (id: string) => `/api/v1/candidate/applications/${id}`,
    create: '/api/v1/candidate/applications',
    update: (id: string) => `/api/v1/candidate/applications/${id}`, // Note: Update endpoint may not exist
    delete: (id: string) => `/api/v1/candidate/applications/${id}`, // Note: Delete endpoint may not exist
    byJob: (jobId: string) => `/api/v1/candidate/applications/job/${jobId}`,
    byCandidate: (candidateId: string) => `/api/v1/candidate/applications/candidate/${candidateId}`, // Note: This endpoint may not exist
    trackingBoard: '/api/v1/recruiter/applications/tracking-board', // Note: This endpoint may not exist, check backend
    stats: '/api/v1/candidate/applications/stats', // Note: This endpoint may not exist, check backend
  },

  candidate: {
    me: '/api/v1/candidate/me',
    experience: {
      base: '/api/v1/candidate/me/experience',
      delete: (id: string) => `/api/v1/candidate/me/experience/${id}`,
      update: (id: string) => `/api/v1/candidate/me/experience/${id}`,
    },
    education: {
      base: '/api/v1/candidate/me/education',
      delete: (id: string) => `/api/v1/candidate/me/education/${id}`,
      update: (id: string) => `/api/v1/candidate/me/education/${id}`,
    },
    skills: {
      base: '/api/v1/candidate/me/skills',
      delete: (id: string) => `/api/v1/candidate/me/skills/${id}`,
      update: (id: string) => `/api/v1/candidate/me/skills/${id}`,
    },
    certifications: {
      base: '/api/v1/candidate/me/certifications',
      delete: (id: string) => `/api/v1/candidate/me/certifications/${id}`,
      update: (id: string) => `/api/v1/candidate/me/certifications/${id}`,
    },
    socialLinks: {
      base: '/api/v1/candidate/me/social-links',
      delete: (id: string) => `/api/v1/candidate/me/social-links/${id}`,
      update: (id: string) => `/api/v1/candidate/me/social-links/${id}`,
    },
  },

  // Resume endpoints (Tailored views)
  resumes: {
    list: '/api/v1/candidate/resumes',
    detail: (id: string) => `/api/v1/candidate/resumes/${id}`,
    create: '/api/v1/candidate/resumes',
    update: (id: string) => `/api/v1/candidate/resumes/${id}`,
    delete: (id: string) => `/api/v1/candidate/resumes/${id}`,
    autofillData: '/api/v1/candidate/resumes/autofill-data',
    experiences: {
      add: (resumeId: string) => `/api/v1/candidate/resumes/${resumeId}/experiences`,
      create: (resumeId: string) => `/api/v1/candidate/resumes/${resumeId}/experiences/create`,
      update: (resumeId: string, expId: string) =>
        `/api/v1/candidate/resumes/${resumeId}/experiences/${expId}`,
      remove: (resumeId: string, expId: string) =>
        `/api/v1/candidate/resumes/${resumeId}/experiences/${expId}`,
    },
    education: {
      add: (resumeId: string) => `/api/v1/candidate/resumes/${resumeId}/education`,
      create: (resumeId: string) => `/api/v1/candidate/resumes/${resumeId}/education/create`,
      update: (resumeId: string, eduId: string) =>
        `/api/v1/candidate/resumes/${resumeId}/education/${eduId}`,
      remove: (resumeId: string, eduId: string) =>
        `/api/v1/candidate/resumes/${resumeId}/education/${eduId}`,
    },
    certifications: {
      add: (resumeId: string) => `/api/v1/candidate/resumes/${resumeId}/certifications`,
      create: (resumeId: string) => `/api/v1/candidate/resumes/${resumeId}/certifications/create`,
      update: (resumeId: string, certId: string) =>
        `/api/v1/candidate/resumes/${resumeId}/certifications/${certId}`,
      remove: (resumeId: string, certId: string) =>
        `/api/v1/candidate/resumes/${resumeId}/certifications/${certId}`,
    },
    skills: {
      add: (resumeId: string) => `/api/v1/candidate/resumes/${resumeId}/skills`,
      create: (resumeId: string) => `/api/v1/candidate/resumes/${resumeId}/skills/create`,
      update: (resumeId: string, skillId: string) =>
        `/api/v1/candidate/resumes/${resumeId}/skills/${skillId}`,
      remove: (resumeId: string, skillId: string) =>
        `/api/v1/candidate/resumes/${resumeId}/skills/${skillId}`,
    },
  },
} as const

export const api = {
  auth: {
    login: (credentials: unknown) => apiClient.post(endpoints.auth.login, credentials),
    signup: (data: unknown) => apiClient.post(endpoints.auth.signup, data),
    logout: () => apiClient.post(endpoints.auth.logout),
    selectRole: (role: string) => apiClient.post(endpoints.auth.selectRole, { role }),
    getCurrentUser: () => apiClient.get(endpoints.auth.me),
  },

  users: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get(
        `${endpoints.users.list}${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
      ),
    get: (id: string) => apiClient.get(endpoints.users.detail(id)),
    update: (id: string, data: unknown) => apiClient.put(endpoints.users.update(id), data),
    delete: (id: string) => apiClient.delete(endpoints.users.delete(id)),
  },

  dashboard: {
    getStats: () => apiClient.get(endpoints.dashboard.stats),
    getRecentActivity: () => apiClient.get(endpoints.dashboard.recentActivity),
  },

  jobs: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get(
        `${endpoints.jobs.list}${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
      ),
    recommendations: (params?: Record<string, unknown>) =>
      apiClient.get(
        `${endpoints.jobs.recommendations}${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
      ),
    search: (params?: Record<string, unknown>) =>
      apiClient.get(
        `${endpoints.jobs.search}${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
      ),
    get: (id: string) => apiClient.get(endpoints.jobs.detail(id)),
    create: (data: unknown) => apiClient.post(endpoints.jobs.create, data),
    generateDraft: (data: unknown) => apiClient.post(endpoints.jobs.generateDraft, data),
    update: (id: string, data: unknown) => apiClient.put(endpoints.jobs.update(id), data),
    delete: (id: string) => apiClient.delete(endpoints.jobs.delete(id)),
  },

  applications: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get(
        `${endpoints.applications.list}${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''}`
      ),
    get: (id: string) => apiClient.get(endpoints.applications.detail(id)),
    create: (data: unknown) => apiClient.post(endpoints.applications.create, data),
    update: (id: string, data: unknown) => apiClient.put(endpoints.applications.update(id), data),
    delete: (id: string) => apiClient.delete(endpoints.applications.delete(id)),
    getByJob: (jobId: string) => apiClient.get(endpoints.applications.byJob(jobId)),
    getByCandidate: (candidateId: string) =>
      apiClient.get(endpoints.applications.byCandidate(candidateId)),
    getTrackingBoard: () => apiClient.get(endpoints.applications.trackingBoard),
    getStats: () => apiClient.get(endpoints.applications.stats),
  },

  candidate: {
    getProfile: () => apiClient.get(endpoints.candidate.me),
    updateProfile: (data: unknown) => apiClient.patch(endpoints.candidate.me, data),

    experience: {
      add: (data: unknown) => apiClient.post(endpoints.candidate.experience.base, data),
      delete: (id: string) => apiClient.delete(endpoints.candidate.experience.delete(id)),
      update: (id: string, data: unknown) =>
        apiClient.patch(endpoints.candidate.experience.update(id), data),
    },
    education: {
      add: (data: unknown) => apiClient.post(endpoints.candidate.education.base, data),
      delete: (id: string) => apiClient.delete(endpoints.candidate.education.delete(id)),
      update: (id: string, data: unknown) =>
        apiClient.patch(endpoints.candidate.education.update(id), data),
    },
    skills: {
      add: (data: unknown) => apiClient.post(endpoints.candidate.skills.base, data),
      delete: (id: string) => apiClient.delete(endpoints.candidate.skills.delete(id)),
      update: (id: string, data: unknown) =>
        apiClient.patch(endpoints.candidate.skills.update(id), data),
    },
    certifications: {
      add: (data: unknown) => apiClient.post(endpoints.candidate.certifications.base, data),
      delete: (id: string) => apiClient.delete(endpoints.candidate.certifications.delete(id)),
      update: (id: string, data: unknown) =>
        apiClient.patch(endpoints.candidate.certifications.update(id), data),
    },
    socialLinks: {
      add: (data: unknown) => apiClient.post(endpoints.candidate.socialLinks.base, data),
      delete: (id: string) => apiClient.delete(endpoints.candidate.socialLinks.delete(id)),
      update: (id: string, data: unknown) =>
        apiClient.patch(endpoints.candidate.socialLinks.update(id), data),
    },
  },

  resumes: {
    list: () => apiClient.get(endpoints.resumes.list),
    get: (id: string) => apiClient.get(endpoints.resumes.detail(id)),
    create: (data: unknown) => apiClient.post(endpoints.resumes.create, data),
    update: (id: string, data: unknown) => apiClient.put(endpoints.resumes.update(id), data),
    delete: (id: string) => apiClient.delete(endpoints.resumes.delete(id)),
    getAutofillData: () => apiClient.get(endpoints.resumes.autofillData),
    experiences: {
      add: (resumeId: string, data: unknown) =>
        apiClient.post(endpoints.resumes.experiences.add(resumeId), data),
      create: (resumeId: string, data: unknown) =>
        apiClient.post(endpoints.resumes.experiences.create(resumeId), data),
      update: (resumeId: string, expId: string, data: unknown) =>
        apiClient.put(endpoints.resumes.experiences.update(resumeId, expId), data),
      remove: (resumeId: string, expId: string) =>
        apiClient.delete(endpoints.resumes.experiences.remove(resumeId, expId)),
    },
    education: {
      add: (resumeId: string, data: unknown) =>
        apiClient.post(endpoints.resumes.education.add(resumeId), data),
      create: (resumeId: string, data: unknown) =>
        apiClient.post(endpoints.resumes.education.create(resumeId), data),
      update: (resumeId: string, eduId: string, data: unknown) =>
        apiClient.put(endpoints.resumes.education.update(resumeId, eduId), data),
      remove: (resumeId: string, eduId: string) =>
        apiClient.delete(endpoints.resumes.education.remove(resumeId, eduId)),
    },
    certifications: {
      add: (resumeId: string, data: unknown) =>
        apiClient.post(endpoints.resumes.certifications.add(resumeId), data),
      create: (resumeId: string, data: unknown) =>
        apiClient.post(endpoints.resumes.certifications.create(resumeId), data),
      update: (resumeId: string, certId: string, data: unknown) =>
        apiClient.put(endpoints.resumes.certifications.update(resumeId, certId), data),
      remove: (resumeId: string, certId: string) =>
        apiClient.delete(endpoints.resumes.certifications.remove(resumeId, certId)),
    },
    skills: {
      add: (resumeId: string, data: unknown) =>
        apiClient.post(endpoints.resumes.skills.add(resumeId), data),
      create: (resumeId: string, data: unknown) =>
        apiClient.post(endpoints.resumes.skills.create(resumeId), data),
      update: (resumeId: string, skillId: string, data: unknown) =>
        apiClient.put(endpoints.resumes.skills.update(resumeId, skillId), data),
      remove: (resumeId: string, skillId: string) =>
        apiClient.delete(endpoints.resumes.skills.remove(resumeId, skillId)),
    },
  },
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }

  const err = error as {
    response?: { data?: { message?: string } }
    message?: string
  }

  if (err?.response?.data?.message) {
    return err.response.data.message
  }

  if (err?.message) {
    return err.message
  }

  return 'An unexpected error occurred'
}

export const setupApiInterceptors = () => {}

setupApiInterceptors()
