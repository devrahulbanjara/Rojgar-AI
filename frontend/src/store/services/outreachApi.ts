import type { ApplicationStatus } from './applicationsApi'
import type { ApiResponse } from './baseApi'
import { baseApi } from './baseApi'

export interface EmailDraftRecord {
  draft_id: string
  application_id: string
  candidate_name: string
  candidate_email: string
  candidate_avatar_url: string | null
  application_status: ApplicationStatus
  score: number | null
  subject: string | null
  body: string | null
  is_approved: boolean
  is_sent: boolean
  is_discarded: boolean
  created_at: string
  updated_at: string
}

export interface PrepareDraftsResponse {
  job_id: string
  drafts_count: number
  new_drafts: number
  message: string
}

export interface SendAllDraftsResponse {
  job_id: string
  queued: number
  message: string
}

export const outreachApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    prepareDrafts: builder.mutation<
      ApiResponse<PrepareDraftsResponse>,
      { jobId: string; direct_send?: boolean }
    >({
      query: ({ jobId, direct_send = false }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/outreach/jobs/${jobId}/prepare-drafts`,
        method: 'POST',
        body: { direct_send },
      }),
      invalidatesTags: ['Applications'],
    }),
    getDrafts: builder.query<ApiResponse<EmailDraftRecord[]>, string>({
      query: (jobId) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/outreach/jobs/${jobId}/drafts`,
      providesTags: ['Applications'],
    }),
    updateDraft: builder.mutation<
      ApiResponse<EmailDraftRecord>,
      { draftId: string; subject?: string; body?: string }
    >({
      query: ({ draftId, ...body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/outreach/drafts/${draftId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Applications'],
    }),
    approveDraft: builder.mutation<
      ApiResponse<EmailDraftRecord>,
      { draftId: string; approved: boolean }
    >({
      query: ({ draftId, approved }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/outreach/drafts/${draftId}/approve`,
        method: 'POST',
        body: { approved },
      }),
      invalidatesTags: ['Applications'],
    }),
    sendAllDrafts: builder.mutation<ApiResponse<SendAllDraftsResponse>, string>({
      query: (jobId) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/outreach/jobs/${jobId}/send-all`,
        method: 'POST',
      }),
      invalidatesTags: ['Applications'],
    }),
  }),
})

export const {
  useApproveDraftMutation,
  useGetDraftsQuery,
  usePrepareDraftsMutation,
  useSendAllDraftsMutation,
  useUpdateDraftMutation,
} = outreachApi
