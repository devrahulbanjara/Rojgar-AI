import { type ApiResponse, baseApi } from './baseApi'

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
  category: string | null
  location: string | null
  location_type: 'remote' | 'onsite' | 'hybrid'
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: 'draft' | 'open' | 'closed' | 'archived'
  created_at: string
}

export interface CandidateDashboardData {
  user_name: string
  stats: CandidateDashboardStats
  recent_applications: CandidateDashboardRecentApplication[]
  recent_activity: CandidateDashboardActivityItem[]
  recommended_jobs: CandidateDashboardRecommendedJob[]
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCandidateDashboard: builder.query<ApiResponse<CandidateDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/candidate`,
      providesTags: ['Applications', 'Profile', 'Resumes'],
    }),
  }),
})

export const { useGetCandidateDashboardQuery } = dashboardApi
