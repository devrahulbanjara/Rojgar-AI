import type { ApplicationStatus } from './applicationsApi'
import { type ApiResponse, baseApi } from './baseApi'
import type { JobStatus } from './jobsApi'

export interface CandidateDashboardStats {
  total_applications: number
  shortlisted: number
  interviews_booked: number
  offers: number
  rejected: number
}

export interface CandidateDashboardApplication {
  id: string
  job_id: string
  job_title: string
  company_name: string
  company_logo_url: string | null
  location: string | null
  location_type: 'remote' | 'onsite' | 'hybrid'
  status: ApplicationStatus
  created_at: string
  updated_at: string
  pipeline_step: number | null
  has_pending_action: boolean
}

export interface CandidateDashboardData {
  user_name: string
  is_open_to_work: boolean
  stats: CandidateDashboardStats
  applications: CandidateDashboardApplication[]
  urgent_action: string | null
}

export interface RecruiterDashboardJob {
  id: string
  title: string
  status: JobStatus
  expires_at: string | null
  days_until_expiry: number | null
  total_applications: number
  applied_count: number
  screening_count: number
  shortlisted_count: number
  rejected_count: number
}

export interface RecruiterDashboardInterview {
  interview_id: string
  application_id: string
  candidate_name: string
  candidate_email: string
  job_title: string
  start_time: string
  application_status: ApplicationStatus
}

export interface RecruiterDashboardDraft {
  draft_id: string
  application_id: string
  candidate_name: string
  job_title: string
  email_type: 'shortlist' | 'rejection'
  subject: string
}

export interface RecruiterDashboardStats {
  active_jobs: number
  total_applications: number
  shortlisted: number
  interviews_today: number
  pending_drafts: number
}

export interface RecruiterDashboardData {
  company_name: string
  recruiter_name: string
  stats: RecruiterDashboardStats
  active_jobs: RecruiterDashboardJob[]
  todays_interviews: RecruiterDashboardInterview[]
  pending_drafts: RecruiterDashboardDraft[]
}

export interface JoinRequestItem {
  membership_id: string
  recruiter_name: string
  recruiter_email: string
  requested_at: string
}

export interface TeamMemberActivity {
  membership_id: string
  recruiter_name: string
  membership_status: 'active' | 'pending' | 'rejected'
  shortlisted_this_month: number
  interviews_this_month: number
}

export interface RecruiterAdminDashboardStats extends RecruiterDashboardStats {
  pending_join_requests: number
}

export interface RecruiterAdminDashboardData {
  company_name: string
  recruiter_name: string
  stats: RecruiterAdminDashboardStats
  active_jobs: RecruiterDashboardJob[]
  todays_interviews: RecruiterDashboardInterview[]
  pending_drafts: RecruiterDashboardDraft[]
  join_requests: JoinRequestItem[]
  team_activity: TeamMemberActivity[]
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCandidateDashboard: builder.query<ApiResponse<CandidateDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/candidate`,
      providesTags: ['Applications'],
    }),
    getRecruiterDashboard: builder.query<ApiResponse<RecruiterDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter`,
      providesTags: ['Jobs', 'Applications', 'Interviews', 'Company'],
    }),
    getRecruiterAdminDashboard: builder.query<ApiResponse<RecruiterAdminDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter-admin`,
      providesTags: ['Jobs', 'Applications', 'Interviews', 'Company'],
    }),
  }),
})

export const {
  useGetCandidateDashboardQuery,
  useGetRecruiterDashboardQuery,
  useGetRecruiterAdminDashboardQuery,
} = dashboardApi
