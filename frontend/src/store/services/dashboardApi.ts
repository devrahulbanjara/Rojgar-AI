import type { ApplicationStatus } from './applicationsApi'
import { type ApiResponse, baseApi } from './baseApi'
import type { JobStatus } from './jobsApi'

export interface RecruiterHomeInterview {
  interview_id: string
  application_id: string
  job_id: string
  candidate_name: string
  job_title: string
  start_time: string
  end_time: string
  location: string | null
}

export interface RecruiterHomeRole {
  job_id: string
  title: string
  status: JobStatus
  location: string | null
  location_type: 'remote' | 'onsite' | 'hybrid'
  created_at: string
  expires_at: string | null
  applicants: number
  to_review: number
  strong: number
  to_contact: number
  upcoming_interviews: number
  to_decide: number
  hiring_completed: boolean
  share_slug: string
}

export interface RecruiterHomeData {
  first_name: string
  company_name: string
  is_admin: boolean
  interviews_today: RecruiterHomeInterview[]
  next_interview: RecruiterHomeInterview | null
  roles: RecruiterHomeRole[]
  drafts: { job_id: string; title: string; updated_at: string }[]
  join_requests: {
    membership_id: string
    recruiter_name: string
    recruiter_email: string
    requested_at: string
  }[]
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecruiterHome: builder.query<ApiResponse<RecruiterHomeData>, void>({
      query: () => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter/home`,
        params: { tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
      }),
      providesTags: ['Applications', 'Jobs', 'Interviews', 'Company'],
    }),
    getRecruiterJobsOverview: builder.query<ApiResponse<RecruiterHomeRole[]>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter/jobs`,
      providesTags: ['Jobs', 'Applications'],
    }),
  }),
})

export const { useGetRecruiterHomeQuery, useGetRecruiterJobsOverviewQuery } = dashboardApi
