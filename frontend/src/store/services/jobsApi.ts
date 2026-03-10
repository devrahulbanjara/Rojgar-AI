import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Types — match the actual backend schema (app/modules/jobs/schemas.py)
// ---------------------------------------------------------------------------

type RawJobStatus = 'draft' | 'active' | 'expired' | 'open' | 'closed' | 'archived' | 'paused'

export type JobStatus = 'draft' | 'active' | 'expired'
export type LocationType = 'onsite' | 'remote' | 'hybrid'

export function normalizeJobStatus(status: string | null | undefined): JobStatus {
  switch (status) {
    case 'active':
    case 'open':
      return 'active'
    case 'expired':
    case 'closed':
    case 'archived':
    case 'paused':
      return 'expired'
    case 'draft':
    default:
      return 'draft'
  }
}

export function serializeJobStatus(status: JobStatus): RawJobStatus {
  switch (status) {
    case 'active':
      return 'open'
    case 'expired':
      return 'closed'
    case 'draft':
    default:
      return 'draft'
  }
}

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
  category: string | null
  location: string | null
  location_type: LocationType
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  applications_count: number
  created_at: string
}

/** Full job detail including description fields */
export interface JobDetail {
  id: string
  company_id: string
  company?: CompanySnippet
  posted_by: string | null
  title: string
  category: string | null
  location: string | null
  location_type: LocationType
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  overview: string | null
  responsibilities: string[]
  requirements: string[]
  preferred_qualifications: string[]
  benefits: string[]
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
  category?: string
  salary_min?: number
  salary_max?: number
  page?: number
  size?: number
}

type RawJobListItem = Omit<JobListItem, 'status'> & { status: string }
type RawJobDetail = Omit<JobDetail, 'status'> & { status: string }

function normalizeJobListItem(job: RawJobListItem): JobListItem {
  return { ...job, status: normalizeJobStatus(job.status) }
}

function normalizeJobDetail(job: RawJobDetail): JobDetail {
  return { ...job, status: normalizeJobStatus(job.status) }
}

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /jobs/ — public: search & list active jobs */
    searchJobs: builder.query<ApiResponse<JobListItem[]>, SearchJobsParams>({
      query: ({
        q,
        location,
        location_type,
        category,
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
          ...(category && { category }),
          ...(salary_min != null && { salary_min }),
          ...(salary_max != null && { salary_max }),
          page,
          size,
        },
      }),
      transformResponse: (response: ApiResponse<RawJobListItem[]>) => ({
        ...response,
        data: (response.data ?? []).map(normalizeJobListItem),
      }),
      providesTags: ['Jobs'],
    }),

    /** POST /jobs/ — create a new job posting (company admin or recruiter) */
    createJob: builder.mutation<ApiResponse<JobDetail>, CreateJobPayload>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/`,
        method: 'POST',
        body: body.status ? { ...body, status: serializeJobStatus(body.status) } : body,
      }),
      transformResponse: (response: ApiResponse<RawJobDetail>) => ({
        ...response,
        data: normalizeJobDetail(response.data),
      }),
      invalidatesTags: ['Jobs'],
    }),

    /** GET /jobs/company/me — list all jobs posted by the current user's company */
    getCompanyJobs: builder.query<ApiResponse<JobListItem[]>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/company/me`,
      transformResponse: (response: ApiResponse<RawJobListItem[]>) => ({
        ...response,
        data: (response.data ?? []).map(normalizeJobListItem),
      }),
      providesTags: ['Jobs'],
    }),

    /** GET /jobs/{job_id} — get full job details including description */
    getJobById: builder.query<ApiResponse<JobDetail>, string>({
      query: (id) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${id}`,
      transformResponse: (response: ApiResponse<RawJobDetail>) => ({
        ...response,
        data: normalizeJobDetail(response.data),
      }),
      providesTags: (_result, _error, id) => [{ type: 'Jobs', id }],
    }),

    /** PATCH /jobs/{job_id} — update a job posting (owner only) */
    updateJob: builder.mutation<ApiResponse<JobDetail>, { id: string } & UpdateJobPayload>({
      query: ({ id, ...body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${id}`,
        method: 'PATCH',
        body: body.status ? { ...body, status: serializeJobStatus(body.status) } : body,
      }),
      transformResponse: (response: ApiResponse<RawJobDetail>) => ({
        ...response,
        data: normalizeJobDetail(response.data),
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Jobs', id }, 'Jobs'],
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
  useDeleteJobMutation,
} = jobsApi
