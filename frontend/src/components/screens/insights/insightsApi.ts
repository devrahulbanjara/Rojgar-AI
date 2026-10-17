import { type ApiResponse, baseApi } from '@/store/services/baseApi'
import type { JobStatus } from '@/store/services/jobsApi'

export type InsightsSource =
  | 'linkedin'
  | 'facebook'
  | 'merojob'
  | 'viber'
  | 'qr'
  | 'walk_in'
  | 'phone'
  | 'referral'
  | 'direct'
  | 'other'

export type InsightsStage = 'applied' | 'shortlisted' | 'interviewed' | 'offered' | 'hired'

export interface InsightsJobReply {
  job_id: string
  title: string
  status: JobStatus
  median_days: number | null
  replied: number
  waiting: number
  oldest_waiting_days: number | null
}

/** GET /dashboards/insights — see backend/app/modules/dashboards/insights.py. */
export interface InsightsData {
  range_from: string
  range_to: string
  job_id: string | null
  jobs: { job_id: string; title: string; status: JobStatus }[]
  total: number
  sources: { source: InsightsSource; count: number }[]
  weekly: { week_start: string; count: number }[]
  median_reply_days: number | null
  replies: InsightsJobReply[]
  progress: { stage: InsightsStage; count: number }[]
}

export interface InsightsArgs {
  jobId?: string
  from: string
  to: string
}

const insightsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecruiterInsights: builder.query<ApiResponse<InsightsData>, InsightsArgs>({
      query: ({ jobId, from, to }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboards/insights`,
        params: {
          ...(jobId ? { job_id: jobId } : {}),
          from,
          to,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
      providesTags: ['Applications', 'Jobs'],
    }),
  }),
})

export const { useGetRecruiterInsightsQuery } = insightsApi
