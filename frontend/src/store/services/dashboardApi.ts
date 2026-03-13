import { type ApiResponse, baseApi } from './baseApi'
import { type JobStatus, normalizeJobStatus } from './jobsApi'

export interface CandidateDashboardStats {
  total_applications: number
  active_interviews: number
  offers_received: number
  total_resumes: number
  profile_completion: number
}

export interface CandidateDashboardRecentApplication {
  id: string
  job_id: string
  status: string
  created_at: string
  updated_at: string
  job_title: string
  company_name: string
  location: string | null
  location_type: 'remote' | 'onsite' | 'hybrid'
}

export interface CandidateDashboardActivityItem {
  id: string
  application_id: string
  status: string
  text: string
  time: string
}

export interface CandidateDashboardRecommendedJob {
  id: string
  company_id: string
  company: {
    id: string
    name: string
    industry: string | null
    company_size: string | null
    location: string | null
    website_url: string | null
    description: string | null
  }
  title: string
  location: string | null
  location_type: 'remote' | 'onsite' | 'hybrid'
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  created_at: string
  match_score: number | null
}

export interface CandidateDashboardData {
  user_name: string
  stats: CandidateDashboardStats
  recent_applications: CandidateDashboardRecentApplication[]
  recent_activity: CandidateDashboardActivityItem[]
  recommended_jobs: CandidateDashboardRecommendedJob[]
}

export interface RecruiterDashboardJob {
  id: string
  company_id: string
  title: string
  location: string | null
  location_type: 'remote' | 'onsite' | 'hybrid'
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  applications_count: number
  created_at: string
}

export interface RecruiterDashboardData {
  company_name: string
  top_jobs: RecruiterDashboardJob[]
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCandidateDashboard: builder.query<ApiResponse<CandidateDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/candidate`,
      transformResponse: (response: ApiResponse<CandidateDashboardData>) => ({
        ...response,
        data: {
          ...response.data,
          recommended_jobs: (response.data.recommended_jobs ?? []).map((job) => ({
            ...job,
            status: normalizeJobStatus(job.status),
          })),
        },
      }),
      providesTags: ['Applications', 'Profile', 'Resumes'],
    }),
    getRecruiterDashboard: builder.query<ApiResponse<RecruiterDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter`,
      transformResponse: (response: ApiResponse<RecruiterDashboardData>) => ({
        ...response,
        data: {
          ...response.data,
          top_jobs: (response.data.top_jobs ?? []).map((job) => ({
            ...job,
            status: normalizeJobStatus(job.status),
          })),
        },
      }),
      providesTags: ['Jobs'],
    }),
  }),
})

export const { useGetCandidateDashboardQuery, useGetRecruiterDashboardQuery } = dashboardApi
