import type { ApplicationStatus } from './applicationsApi'
import { type ApiResponse, baseApi } from './baseApi'

export interface InterviewItem {
  id: string
  application_id: string
  cal_booking_uid: string
  candidate_name: string
  candidate_email: string
  applicant_avatar_url: string | null
  start_time: string
  end_time: string
  timezone: string | null
  location: string | null
  title: string | null
  created_at: string
  application_status: ApplicationStatus
  job_id: string
  job_title: string
  company_id: string
}

export interface CandidateInterviewView {
  id: string
  application_id: string
  start_time: string
  end_time: string
  timezone: string | null
  location: string | null
  title: string | null
  job_id: string
  job_title: string
  company_name: string
  application_status: ApplicationStatus
}

export interface GetInterviewsParams {
  job_id?: string
  start?: string
  end?: string
}

export const interviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInterviews: builder.query<ApiResponse<InterviewItem[]>, GetInterviewsParams | void>({
      query: (params) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/interviews/`,
        params: params ?? undefined,
      }),
      providesTags: ['Interviews'],
    }),
    markInterviewComplete: builder.mutation<ApiResponse<InterviewItem>, string>({
      query: (interviewId) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/interviews/${interviewId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['Interviews', 'Applications'],
    }),

    getMyInterviews: builder.query<ApiResponse<CandidateInterviewView[]>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/interviews/my`,
      providesTags: ['Interviews'],
    }),
  }),
})

export const { useGetInterviewsQuery, useMarkInterviewCompleteMutation, useGetMyInterviewsQuery } =
  interviewsApi
