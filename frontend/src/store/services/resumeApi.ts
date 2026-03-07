import { baseApi } from './baseApi'
import type { ApiResponse } from './baseApi'

// ---------------------------------------------------------------------------
// API-level types — mirrors the backend response exactly
// ---------------------------------------------------------------------------

export interface ApiResumeExperience {
  id: string
  company_name: string
  title: string
  start_date: string | null
  end_date: string | null
  description: string[]
}

export interface ApiResumeEducation {
  id: string
  institution: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
}

export interface ApiResumeSkill {
  id: string
  skill_name: string
}

export interface ApiResumeData {
  id: string
  user_id: string
  resume_name: string
  headline: string | null
  summary: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  years_of_experience: number | null
  experiences: ApiResumeExperience[]
  educations: ApiResumeEducation[]
  skills: ApiResumeSkill[]
  created_at: string
  updated_at: string
}

export interface UpdateResumeRequest {
  resume_name?: string
  headline?: string | null
  summary?: string | null
  phone?: string | null
  location?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  experiences?: {
    company_name: string
    title: string
    start_date: string | null
    end_date: string | null
    description: string[]
  }[]
  educations?: {
    institution: string
    degree: string | null
    field_of_study: string | null
    start_date: string | null
    end_date: string | null
  }[]
  skills?: { skill_name: string }[]
}

export interface CreateResumeRequest {
  resume_name: string
}

type ResumeApiResponse = ApiResponse<ApiResumeData>
type ResumesListApiResponse = ApiResponse<ApiResumeData[]>

// ---------------------------------------------------------------------------
// Resume API — injected into the shared baseApi
// ---------------------------------------------------------------------------

export const resumeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** POST /resumes — create a new resume (populated from profile) */
    createResume: builder.mutation<ResumeApiResponse, CreateResumeRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/resumes`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Resumes'],
    }),

    /** GET /resumes — list all resumes for the current user */
    getMyResumes: builder.query<ResumesListApiResponse, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/resumes/me`,
      providesTags: ['Resumes'],
    }),

    /** GET /resumes/{id} — fetch a single resume with full nested data */
    getResumeById: builder.query<ResumeApiResponse, string>({
      query: (id) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/resumes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Resumes', id }],
    }),

    /** PUT /resumes/{id} — update a resume's fields and child collections */
    updateResume: builder.mutation<ResumeApiResponse, { id: string; body: UpdateResumeRequest }>({
      query: ({ id, body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/resumes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Resumes', id }],
    }),

    /** DELETE /resumes/{id} — delete a resume */
    deleteResume: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/resumes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Resumes'],
    }),
  }),
})

export const {
  useCreateResumeMutation,
  useGetMyResumesQuery,
  useGetResumeByIdQuery,
  useLazyGetResumeByIdQuery,
  useUpdateResumeMutation,
  useDeleteResumeMutation,
} = resumeApi
