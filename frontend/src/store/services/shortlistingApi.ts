import type { ApiResponse } from './baseApi'
import { baseApi } from './baseApi'

export type ShortlistStatus = 'not_started' | 'in_progress' | 'completed' | 'failed'

export interface ShortlistSummary {
  job_id: string
  total_applications: number
  scored: number
  pending_review: number
  shortlist_status: ShortlistStatus
  final_shortlist_completed: boolean
  shortlist_threshold: number
}

export interface TriggerShortlistResponse {
  job_id: string
  shortlist_status: ShortlistStatus
  message: string
}

export interface FinalizeShortlistResponse {
  job_id: string
  updated_applications: number
  success: boolean
}

export const shortlistingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShortlistSummary: builder.query<ApiResponse<ShortlistSummary>, string>({
      query: (jobId) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/shortlisting/jobs/${jobId}/summary`,
      providesTags: ['Applications', 'Jobs'],
    }),
    triggerShortlisting: builder.mutation<ApiResponse<TriggerShortlistResponse>, string>({
      query: (jobId) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/shortlisting/jobs/${jobId}/trigger`,
        method: 'POST',
      }),
      invalidatesTags: ['Applications', 'Jobs'],
    }),
    finalizeShortlist: builder.mutation<
      ApiResponse<FinalizeShortlistResponse>,
      { jobId: string; use_ai_recommendations: boolean; threshold?: number }
    >({
      query: ({ jobId, ...body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/shortlisting/jobs/${jobId}/finalize`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Applications', 'Jobs'],
    }),
  }),
})

export const {
  useFinalizeShortlistMutation,
  useGetShortlistSummaryQuery,
  useTriggerShortlistingMutation,
} = shortlistingApi
