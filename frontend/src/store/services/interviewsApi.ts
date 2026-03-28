import { type ApiResponse, baseApi } from './baseApi'

export interface InterviewItem {
  id: string
  application_id: string
  cal_booking_uid: string
  candidate_name: string
  candidate_email: string
  start_time: string
  end_time: string
  timezone: string | null
  location: string | null
  title: string | null
  created_at: string
  job_id: string
  job_title: string
  company_id: string
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
  }),
})

export const { useGetInterviewsQuery } = interviewsApi
