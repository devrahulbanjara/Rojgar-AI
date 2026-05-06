import { type ApiResponse, baseApi } from './baseApi'

export interface RecruiterPreference {
  id: string
  user_id: string
  timezone: string | null
  notification_email_enabled: boolean
  notification_in_app_enabled: boolean
  default_interview_duration_minutes: number
  default_interview_buffer_minutes: number
  outreach_signature: string | null
  chat_default_scope: string
  created_at: string
  updated_at: string
}

export interface UpdateRecruiterPreferenceRequest {
  timezone?: string | null
  default_interview_duration_minutes?: number
  default_interview_buffer_minutes?: number
  outreach_signature?: string | null
  chat_default_scope?: string
}

export const recruiterPreferencesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecruiterPreferences: builder.query<ApiResponse<RecruiterPreference>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/recruiter/preferences`,
      providesTags: ['RecruiterPreferences'],
    }),
    updateRecruiterPreferences: builder.mutation<
      ApiResponse<RecruiterPreference>,
      UpdateRecruiterPreferenceRequest
    >({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/recruiter/preferences`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['RecruiterPreferences'],
    }),
  }),
})

export const { useGetRecruiterPreferencesQuery, useUpdateRecruiterPreferencesMutation } =
  recruiterPreferencesApi
