/** Jobs: types mirror backend/app/modules/jobs/schemas.py exactly. */
import { type ApiResponse, baseApi } from './baseApi'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

export type JobStatus = 'draft' | 'open' | 'closed'
export type ClosedReason = 'hired' | 'cancelled' | 'expired'
export type LocationType = 'onsite' | 'remote' | 'hybrid'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship'
export type JobCategory =
  | 'banking_finance'
  | 'healthcare'
  | 'education'
  | 'hospitality_tourism'
  | 'sales_retail'
  | 'manufacturing'
  | 'logistics_driving'
  | 'it_software'
  | 'ngo_ingo'
  | 'government_public'
  | 'office_admin'
  | 'construction_engineering'
  | 'other'
export type QuestionType = 'short_text' | 'yes_no'

export interface JobQuestion {
  label: string
  type: QuestionType
  required: boolean
  /** yes/no only: applicants who answer the other way are marked a weak fit. */
  knockout_answer: 'yes' | 'no' | null
}

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

/** A criterion that looks like a protected ground (Labour Act 2074 s.6). */
export interface CriterionWarning {
  field: 'must_haves' | 'nice_to_haves' | 'questions'
  index: number
  text: string
  ground: string
  message: string
}

export interface JobListItem {
  id: string
  company_id: string
  company: CompanySnippet
  slug: string | null
  title: string
  location: string | null
  location_type: LocationType
  category: JobCategory
  employment_type: EmploymentType
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  closed_reason: ClosedReason | null
  closes_at: string | null
  closed_at: string | null
  applications_count: number
  has_applied: boolean
  created_at: string
  match_score: number | null
  is_fallback: boolean
}

export interface JobDetail {
  id: string
  company_id: string
  company: CompanySnippet
  posted_by: string | null
  slug: string | null
  title: string
  location: string | null
  location_type: LocationType
  category: JobCategory
  employment_type: EmploymentType
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  closed_reason: ClosedReason | null
  closes_at: string | null
  closed_at: string | null
  /** Markdown. */
  description: string
  must_haves: string[]
  nice_to_haves: string[]
  questions: JobQuestion[]
  applications_count: number
  source_counts: Record<string, number> | null
  has_applied: boolean
  created_at: string
  updated_at: string
  warnings: CriterionWarning[]
}

/** The fields a person edits in the job builder. */
export type JobFields = Pick<
  JobDetail,
  | 'title'
  | 'location'
  | 'location_type'
  | 'category'
  | 'employment_type'
  | 'salary_min'
  | 'salary_max'
  | 'currency'
  | 'closes_at'
  | 'description'
  | 'must_haves'
  | 'nice_to_haves'
  | 'questions'
>

export type JobCreate = Partial<JobFields> & { title: string; status?: 'draft' | 'open' }

/** Only provided fields change. Closing needs closed_reason; reopening an expired job needs a future closes_at. */
export type JobUpdate = Partial<JobFields> & {
  status?: JobStatus
  closed_reason?: 'hired' | 'cancelled'
}

export interface SuggestMustHavesResponse {
  must_haves: string[]
  nice_to_haves: string[]
  questions: JobQuestion[]
  warnings: CriterionWarning[]
}

export interface RoleTemplate {
  key: string
  title: string
  category: JobCategory
  employment_type: EmploymentType
  salary_min: number
  salary_max: number
  currency: string
  description: string
  must_haves: string[]
  nice_to_haves: string[]
  questions: JobQuestion[]
}

const jobTags = (id: string) => [{ type: 'Jobs' as const, id }, 'Jobs' as const]

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyJobs: builder.query<JobListItem[], void>({
      query: () => `${API}/jobs/company/me`,
      transformResponse: (res: ApiResponse<JobListItem[]>) => res.data,
      providesTags: ['Jobs'],
    }),

    getJob: builder.query<JobDetail, string>({
      query: (id) => `${API}/jobs/${id}`,
      transformResponse: (res: ApiResponse<JobDetail>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Jobs', id }],
    }),

    createJob: builder.mutation<JobDetail, JobCreate>({
      query: (body) => ({ url: `${API}/jobs/`, method: 'POST', body }),
      transformResponse: (res: ApiResponse<JobDetail>) => res.data,
      invalidatesTags: ['Jobs'],
    }),

    /** Edit, publish, close (status closed + closed_reason) or reopen (status open). */
    updateJob: builder.mutation<JobDetail, { id: string } & JobUpdate>({
      query: ({ id, ...body }) => ({ url: `${API}/jobs/${id}`, method: 'PATCH', body }),
      transformResponse: (res: ApiResponse<JobDetail>) => res.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(jobsApi.util.upsertQueryData('getJob', id, data))
        } catch {
          /* surfaced by the caller */
        }
      },
      // Closing moves waiting applicants to Not selected.
      invalidatesTags: (_r, _e, { id, status }) =>
        status === 'closed'
          ? [...jobTags(id), 'Applications', 'Candidates']
          : status
            ? jobTags(id)
            : ['Jobs'],
    }),

    deleteJob: builder.mutation<null, string>({
      query: (id) => ({ url: `${API}/jobs/${id}`, method: 'DELETE' }),
      transformResponse: () => null,
      invalidatesTags: ['Jobs', 'Applications', 'Candidates'],
    }),

    suggestMustHaves: builder.mutation<
      SuggestMustHavesResponse,
      { title: string | null; description: string }
    >({
      query: (body) => ({ url: `${API}/jobs/suggest-must-haves`, method: 'POST', body }),
      transformResponse: (res: ApiResponse<SuggestMustHavesResponse>) => res.data,
    }),

    getJobTemplates: builder.query<RoleTemplate[], JobCategory | null>({
      query: (category) => ({
        url: `${API}/job-templates`,
        params: category ? { category } : undefined,
      }),
      transformResponse: (res: ApiResponse<RoleTemplate[]>) => res.data,
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
})

export const {
  useGetCompanyJobsQuery,
  useGetJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useSuggestMustHavesMutation,
  useGetJobTemplatesQuery,
} = jobsApi
