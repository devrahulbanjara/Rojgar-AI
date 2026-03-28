import type { Paginated } from '@/lib/types/user'

import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Types — match the actual backend schema (app/modules/jobs/schemas.py)
// ---------------------------------------------------------------------------

export type JobStatus = 'draft' | 'active' | 'expired'
export type LocationType = 'onsite' | 'remote' | 'hybrid'

export function getJobStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'expired':
      return 'Expired'
    case 'draft':
    default:
      return 'Draft'
  }
}

/** Minimal company info embedded in job responses */
export interface CompanySnippet {
  id: string
  name: string
  logo_url: string | null
  industry: string | null
  company_size: string | null
  location: string | null
  website_url: string | null
  description: string | null
}

/** Lightweight summary returned by list endpoints */
export interface JobListItem {
  id: string
  company_id: string
  company?: CompanySnippet
  title: string
  location: string | null
  location_type: LocationType
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  auto_shortlist: boolean
  shortlist_threshold: number
  expires_at: string | null
  applications_count: number
  final_shortlist_completed: boolean
  hiring_completed: boolean
  created_at: string
  match_score: number | null
  is_fallback: boolean
}

/** Full job detail including description fields */
export interface JobDetail {
  id: string
  company_id: string
  company?: CompanySnippet
  posted_by: string | null
  title: string
  location: string | null
  location_type: LocationType
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  auto_shortlist: boolean
  shortlist_threshold: number
  expires_at: string | null
  overview: string | null
  responsibilities: string[]
  requirements: string[]
  preferred_qualifications: string[]
  benefits: string[]
  applications_count: number
  hiring_completed: boolean
  created_at: string
  updated_at: string
}

export interface CreateJobPayload {
  title: string
  location?: string
  location_type?: LocationType
  salary_min?: number
  salary_max?: number
  currency?: string
  status?: JobStatus
  auto_shortlist?: boolean
  shortlist_threshold?: number
  expires_at?: string
  overview?: string
  responsibilities?: string[]
  requirements?: string[]
  preferred_qualifications?: string[]
  benefits?: string[]
}

export type UpdateJobPayload = Partial<CreateJobPayload>

export interface SearchJobsParams {
  q?: string
  location?: string
  location_type?: LocationType
  salary_min?: number
  salary_max?: number
  page?: number
  size?: number
}

export interface SetHiringCompletedPayload {
  id: string
  hiring_completed: boolean
}

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /jobs/ — public: search & list active jobs */
    searchJobs: builder.query<ApiResponse<Paginated<JobListItem>>, SearchJobsParams>({
      query: ({
        q,
        location,
        location_type,
        salary_min,
        salary_max,
        page = 1,
        size = 20,
      } = {}) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/`,
        params: {
          ...(q && { q }),
          ...(location && { location }),
          ...(location_type && { location_type }),
          ...(salary_min != null && { salary_min }),
          ...(salary_max != null && { salary_max }),
          page,
          size,
        },
      }),
      providesTags: ['Jobs'],
    }),

    /** POST /jobs/ — create a new job posting (company admin or recruiter) */
    createJob: builder.mutation<ApiResponse<JobDetail>, CreateJobPayload>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Jobs'],
    }),

    /** GET /jobs/company/me — list all jobs posted by the current user's company */
    getCompanyJobs: builder.query<ApiResponse<JobListItem[]>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/company/me`,
      providesTags: ['Jobs'],
    }),

    /** GET /jobs/{job_id} — get full job details including description */
    getJobById: builder.query<ApiResponse<JobDetail>, string>({
      query: (id) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Jobs', id }],
    }),

    /** PATCH /jobs/{job_id} — update a job posting (owner only) */
    updateJob: builder.mutation<ApiResponse<JobDetail>, { id: string } & UpdateJobPayload>({
      query: ({ id, ...body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Jobs', id }, 'Jobs'],
    }),

    setHiringCompleted: builder.mutation<
      ApiResponse<{ hiring_completed: boolean }>,
      SetHiringCompletedPayload
    >({
      query: ({ id, hiring_completed }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${id}/hiring-completed`,
        method: 'PATCH',
        params: { hiring_completed },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Jobs', id }, 'Jobs', 'Interviews'],
    }),

    /** DELETE /jobs/{job_id} — delete a job posting (owner only) */
    deleteJob: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Jobs'],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
})

export const {
  useSearchJobsQuery,
  useCreateJobMutation,
  useGetCompanyJobsQuery,
  useGetJobByIdQuery,
  useUpdateJobMutation,
  useSetHiringCompletedMutation,
  useDeleteJobMutation,
} = jobsApi
