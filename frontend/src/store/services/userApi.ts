import type {
  CandidateProfile,
  JobApplication,
  Paginated,
  Resume,
  UpdateCandidateProfileRequest,
} from '@/lib/types/user'

import { baseApi } from './baseApi'

// Re-export canonical types for components that import from this file
export type { CandidateProfile, Resume, JobApplication }

// ---------------------------------------------------------------------------
// User / Candidate API
// ---------------------------------------------------------------------------

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /users/me/profile */
    getCandidateProfile: builder.query<CandidateProfile, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/profile`,
      providesTags: ['User'],
    }),

    /** PATCH /users/me/profile */
    updateProfile: builder.mutation<CandidateProfile, UpdateCandidateProfileRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/profile`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    /** GET /users/me/resumes */
    getResumes: builder.query<Resume[], void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/resumes`,
      providesTags: ['User'],
    }),

    /** POST /users/me/resumes (multipart/form-data) */
    uploadResume: builder.mutation<Resume, FormData>({
      query: (formData) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/resumes`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    /** DELETE /users/me/resumes/:id */
    deleteResume: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/resumes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    /** GET /users/me/applications */
    getMyApplications: builder.query<
      Paginated<JobApplication>,
      { page?: number; limit?: number; status?: JobApplication['status'] }
    >({
      query: ({ page = 1, limit = 10, status } = {}) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/applications`,
        params: { page, limit, ...(status && { status }) },
      }),
      providesTags: ['Applications'],
    }),

    /** GET /users/me/applications/:id */
    getApplicationById: builder.query<JobApplication, string>({
      query: (id) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me/applications/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Applications', id }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetCandidateProfileQuery,
  useUpdateProfileMutation,
  useGetResumesQuery,
  useUploadResumeMutation,
  useDeleteResumeMutation,
  useGetMyApplicationsQuery,
  useGetApplicationByIdQuery,
} = userApi
