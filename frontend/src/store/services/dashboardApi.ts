import { type ApiResponse, baseApi } from './baseApi'
import { type JobStatus } from './jobsApi'

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
  company_logo_url: string | null
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
    logo_url?: string | null
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

export interface RecruiterDashboardStats {
  active_job_posts: number
  total_applications: number
  pending_ai_reviews: number
  pending_email_drafts: number
}

export interface RecruiterDashboardData {
  company_name: string
  stats: RecruiterDashboardStats
  top_jobs: RecruiterDashboardJob[]
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCandidateDashboard: builder.query<ApiResponse<CandidateDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/candidate`,
      providesTags: ['Applications', 'Profile', 'Resumes'],
    }),
    getRecruiterDashboard: builder.query<ApiResponse<RecruiterDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter`,
      providesTags: ['Jobs'],
    }),
  }),
})

export const { useGetCandidateDashboardQuery, useGetRecruiterDashboardQuery } = dashboardApi
