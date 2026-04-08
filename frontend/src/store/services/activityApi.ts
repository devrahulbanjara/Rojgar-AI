import { type ApiResponse, baseApi } from './baseApi'

export interface ActivityEvent {
  id: string
  user_id: string | null
  company_id: string | null
  application_id: string | null
  job_id: string | null
  interview_id: string | null
  draft_id: string | null
  actor_user_id: string | null
  event_type: string
  audience: string
  title: string
  description: string | null
  href: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyActivity: builder.query<ApiResponse<ActivityEvent[]>, number | void>({
      query: (limit) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/activity/me`,
        params: limit ? { limit } : undefined,
      }),
      providesTags: ['Activity'],
    }),
    getCompanyActivity: builder.query<ApiResponse<ActivityEvent[]>, number | void>({
      query: (limit) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/activity/company`,
        params: limit ? { limit } : undefined,
      }),
      providesTags: ['Activity'],
    }),
  }),
})

export const { useGetMyActivityQuery, useGetCompanyActivityQuery } = activityApi
