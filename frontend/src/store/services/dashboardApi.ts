import type { ApplicationStatus } from './applicationsApi'
import { type ApiResponse, baseApi } from './baseApi'
import type { JobStatus } from './jobsApi'

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
}

export interface CandidateDashboardInterview {
  interview_id: string
  application_id: string
  job_id: string
  job_title: string
  company_name: string
  company_logo_url: string | null
  start_time: string
  end_time: string
  location: string | null
  title: string | null
  application_status: ApplicationStatus
}

export interface CandidateDashboardData {
  user_name: string
  is_open_to_work: boolean
  applications: CandidateDashboardApplication[]
  interviews: CandidateDashboardInterview[]
}

export interface StageCountPoint {
  stage: string
  count: number
}

export interface CandidateDashboardAnalyticsStats {
  total_applications: number
  screening: number
  shortlisted: number
  interviews: number
  offers: number
  rejected: number
}

export interface CandidateDashboardAnalyticsTimeseriesPoint {
  date: string
  applications: number
  shortlisted: number
  interviews: number
  offers: number
  rejected: number
}

export interface CandidateDashboardAnalyticsVelocity {
  avg_days_to_shortlist: number | null
  avg_days_to_interview: number | null
  avg_days_to_offer: number | null
}

export interface CandidateDashboardAnalyticsData {
  range_key: string
  stats: CandidateDashboardAnalyticsStats
  funnel: StageCountPoint[]
  timeseries: CandidateDashboardAnalyticsTimeseriesPoint[]
  velocity: CandidateDashboardAnalyticsVelocity
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
  active_jobs: number
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

export interface RecruiterDashboardAnalyticsStats {
  active_jobs: number
  applications: number
  screening: number
  shortlisted: number
  interview_booked: number
  interview_completed: number
  offers: number
  pending_drafts: number
}

export interface RecruiterDashboardAnalyticsTimeseriesPoint {
  date: string
  new_applicants: number
  completed_reviews: number
  interviews_scheduled: number
}

export interface InterviewLoadPoint {
  date: string
  count: number
}

export interface ScoreDistributionBucket {
  label: string
  count: number
}

export interface ScoreDistribution {
  buckets: ScoreDistributionBucket[]
}

export interface JobHealthPoint {
  job_id: string
  job_title: string
  days_until_expiry: number | null
  applications: number
  shortlisted: number
  interviews: number
  offers: number
}

export interface OutreachStateBreakdown {
  drafted: number
  approved: number
  sent: number
  discarded: number
}

export interface RecruiterOutreachSummary {
  shortlist: OutreachStateBreakdown
  rejection: OutreachStateBreakdown
}

export interface RecruiterDashboardAnalyticsVelocity {
  avg_days_to_review: number | null
  avg_days_to_shortlist: number | null
  avg_days_to_interview: number | null
}

export interface RecruiterDashboardAnalyticsData {
  range_key: string
  stats: RecruiterDashboardAnalyticsStats
  funnel: StageCountPoint[]
  applications_timeseries: RecruiterDashboardAnalyticsTimeseriesPoint[]
  interview_load: InterviewLoadPoint[]
  score_distribution: ScoreDistribution
  job_health: JobHealthPoint[]
  outreach: RecruiterOutreachSummary
  velocity: RecruiterDashboardAnalyticsVelocity
}

export interface MembershipBreakdownPoint {
  status: 'active' | 'pending' | 'rejected'
  count: number
}

export interface JoinRequestTimeseriesPoint {
  date: string
  requested: number
  approved: number
  rejected: number
}

export interface RecruiterAdminDashboardAnalyticsStats {
  active_jobs: number
  applications: number
  shortlisted: number
  interviews: number
  offers: number
  pending_join_requests: number
  active_recruiters: number
}

export interface RecruiterAdminDashboardAnalyticsData {
  range_key: string
  stats: RecruiterAdminDashboardAnalyticsStats
  company_funnel: StageCountPoint[]
  join_request_timeseries: JoinRequestTimeseriesPoint[]
  membership_breakdown: MembershipBreakdownPoint[]
  team_activity: TeamMemberActivity[]
  portfolio_health: JobHealthPoint[]
  velocity: RecruiterDashboardAnalyticsVelocity
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCandidateDashboard: builder.query<ApiResponse<CandidateDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/candidate`,
      providesTags: ['Applications'],
    }),
    getCandidateDashboardAnalytics: builder.query<
      ApiResponse<CandidateDashboardAnalyticsData>,
      string | void
    >({
      query: (range_key = '30d') => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/candidate/analytics`,
        params: { range_key },
      }),
      providesTags: ['Applications', 'Profile'],
    }),
    getRecruiterDashboard: builder.query<ApiResponse<RecruiterDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter`,
      providesTags: ['Jobs', 'Applications', 'Interviews', 'Company'],
    }),
    getRecruiterDashboardAnalytics: builder.query<
      ApiResponse<RecruiterDashboardAnalyticsData>,
      string | void
    >({
      query: (range_key = '30d') => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter/analytics`,
        params: { range_key },
      }),
      providesTags: ['Jobs', 'Applications', 'Interviews', 'Company'],
    }),
    getRecruiterAdminDashboard: builder.query<ApiResponse<RecruiterAdminDashboardData>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter-admin`,
      providesTags: ['Jobs', 'Applications', 'Interviews', 'Company'],
    }),
    getRecruiterAdminDashboardAnalytics: builder.query<
      ApiResponse<RecruiterAdminDashboardAnalyticsData>,
      string | void
    >({
      query: (range_key = '30d') => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/recruiter-admin/analytics`,
        params: { range_key },
      }),
      providesTags: ['Jobs', 'Applications', 'Interviews', 'Company'],
    }),
  }),
})

export const {
  useGetCandidateDashboardQuery,
  useGetCandidateDashboardAnalyticsQuery,
  useGetRecruiterDashboardQuery,
  useGetRecruiterDashboardAnalyticsQuery,
  useGetRecruiterAdminDashboardQuery,
  useGetRecruiterAdminDashboardAnalyticsQuery,
} = dashboardApi
