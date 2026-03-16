import { baseApi } from './baseApi'
import type { ApiResponse } from './baseApi'
import type { ApiResumeData } from './resumeApi'

// ---------------------------------------------------------------------------
// Types — mirrors the /profiles/* API contract exactly
// ---------------------------------------------------------------------------

/** One work experience item as returned by and sent to the API. */
export interface ProfileExperience {
  id?: string
  company_name: string
  title: string
  start_date: string | null // "YYYY-MM-DD"
  end_date: string | null // null means "currently working here"
  description: string[]
}

/** One education item as returned by and sent to the API. */
export interface ProfileEducation {
  id?: string
  institution: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
}

/** One skill item as returned by and sent to the API. */
export interface ProfileSkill {
  id?: string
  skill_name: string
}

/** Full profile data shape returned by `GET /profiles/me` and `GET /profiles/{user_id}`. */
export interface CandidateProfileData {
  id: string
  user_id: string
  avatar_url: string | null
  headline: string | null
  summary: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  years_of_experience: number | null
  target_roles: string[]
  experiences: ProfileExperience[]
  educations: ProfileEducation[]
  skills: ProfileSkill[]
  created_at: string
  updated_at: string
}

/** Request body for `PUT /profiles/me`. All fields are optional. */
export interface UpdateProfileRequest {
  headline?: string | null
  summary?: string | null
  phone?: string | null
  location?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  years_of_experience?: number | null
  target_roles?: string[]
  experiences?: Array<{
    company_name: string
    title: string
    start_date: string | null
    end_date: string | null
    description: string[]
  }>
  educations?: Array<{
    institution: string
    degree: string | null
    field_of_study: string | null
    start_date: string | null
    end_date: string | null
  }>
  skills?: Array<{ skill_name: string }>
}

export interface ResumeImportExperience {
  company_name: string | null
  title: string | null
  start_date: string | null
  end_date: string | null
  description: string[]
}

export interface ResumeImportEducation {
  institution: string | null
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
}

export interface ResumeImportSkill {
  skill_name: string
}

export interface ResumeImportProfileData {
  headline: string | null
  summary: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  years_of_experience: number | null
  target_roles: string[]
  experiences: ResumeImportExperience[]
  educations: ResumeImportEducation[]
  skills: ResumeImportSkill[]
  warnings: string[]
}

export interface ResumeImportTargetOption {
  id: string
  resume_name: string
}

export interface ResumeImportPreviewData {
  source_file_name: string
  extracted_profile: ResumeImportProfileData
  available_resume_targets: ResumeImportTargetOption[]
}

export interface ResumeImportTaskStartData {
  task_id: string
  status: 'pending' | 'processing'
}

export interface ResumeImportTaskStatusData {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  source_file_name: string | null
  result: ResumeImportPreviewData | null
  error: string | null
  created_at: string
  updated_at: string
}

export type ResumeImportAction = 'update_profile' | 'create_resume' | 'update_resume'

export interface ResumeImportCommitRequest {
  action: ResumeImportAction
  resume_id: string | null
  resume_name: string | null
  data: ResumeImportProfileData
}

export interface ResumeImportCommitData {
  target_type: 'profile' | 'resume'
  target_id: string
  profile: CandidateProfileData | null
  resume: ApiResumeData | null
}

type ProfileApiResponse = ApiResponse<CandidateProfileData>
type EmptyResponse = ApiResponse<null>
type ResumeImportPreviewResponse = ApiResponse<ResumeImportPreviewData>
type ResumeImportTaskStartResponse = ApiResponse<ResumeImportTaskStartData>
type ResumeImportTaskStatusResponse = ApiResponse<ResumeImportTaskStatusData>
type ResumeImportCommitResponse = ApiResponse<ResumeImportCommitData>

// ---------------------------------------------------------------------------
// Profile API — injected into the shared baseApi
// ---------------------------------------------------------------------------

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /profiles/me — authenticated candidate's own profile */
    getMyProfile: builder.query<ProfileApiResponse, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me`,
      providesTags: ['Profile'],
    }),

    /** PUT /profiles/me — replace-update the authenticated candidate's profile */
    updateMyProfile: builder.mutation<ProfileApiResponse, UpdateProfileRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),

    updateMyAvatar: builder.mutation<ProfileApiResponse, FormData>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me/avatar`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Profile', 'User'],
    }),

    /** POST /profiles/onboard — Set is_onboarded=True and save target roles */
    completeOnboarding: builder.mutation<ProfileApiResponse, { target_roles: string[] }>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/onboard`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profile', 'User'],
    }),

    removeMyAvatar: builder.mutation<EmptyResponse, void>({
      query: () => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me/avatar`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Profile', 'User'],
    }),

    /** GET /profiles/{user_id} — public profile by user ID */
    getPublicProfile: builder.query<ProfileApiResponse, string>({
      query: (userId) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/${userId}`,
      providesTags: (_result, _error, id) => [{ type: 'Profile', id }],
    }),

    previewResumeImport: builder.mutation<ResumeImportPreviewResponse, FormData>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me/ai-import/preview`,
        method: 'POST',
        body,
      }),
    }),

    startResumeImport: builder.mutation<ResumeImportTaskStartResponse, FormData>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me/ai-import/upload`,
        method: 'POST',
        body,
      }),
    }),

    getResumeImportTaskStatus: builder.query<ResumeImportTaskStatusResponse, string>({
      query: (taskId) =>
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me/ai-import/tasks/${taskId}`,
    }),

    commitResumeImport: builder.mutation<ResumeImportCommitResponse, ResumeImportCommitRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/profiles/me/ai-import/commit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profile', 'Resumes'],
    }),
  }),
})

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUpdateMyAvatarMutation,
  useCompleteOnboardingMutation,
  useRemoveMyAvatarMutation,
  useGetPublicProfileQuery,
  usePreviewResumeImportMutation,
  useStartResumeImportMutation,
  useGetResumeImportTaskStatusQuery,
  useLazyGetResumeImportTaskStatusQuery,
  useCommitResumeImportMutation,
} = profileApi
