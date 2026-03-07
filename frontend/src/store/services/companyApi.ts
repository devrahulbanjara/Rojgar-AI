import type {
  CompanyProfile,
  CreateJobRequest,
  JobApplication,
  JobListing,
  Paginated,
  RecruiterMember,
  UpdateCompanyProfileRequest,
  UpdateJobRequest,
} from '@/lib/types/user'

import { type ApiResponse, baseApi } from './baseApi'

// Re-export canonical types for components that import from this file
export type {
  CompanyProfile,
  JobListing,
  CreateJobRequest,
  UpdateJobRequest,
  JobApplication,
  Paginated,
  RecruiterMember,
}

// ---------------------------------------------------------------------------
// Company registration & join-request types
// ---------------------------------------------------------------------------

export interface RegisterCompanyRequest {
  setup_token: string
  company_name: string
  industry: string
  company_size: string
  website?: string
  description?: string
  location?: string
}

export interface JoinCompanyRequest {
  setup_token: string
  company_name: string
  message?: string
}

type EmptyResponse = ApiResponse<null>

// ---------------------------------------------------------------------------
// Company API
// ---------------------------------------------------------------------------

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /companies/me */
    getMyCompany: builder.query<CompanyProfile, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me`,
      providesTags: ['Company'],
    }),

    /** PATCH /companies/me */
    updateCompany: builder.mutation<CompanyProfile, UpdateCompanyProfileRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Company'],
    }),

    /** GET /companies/me/jobs */
    getCompanyJobs: builder.query<
      Paginated<JobListing>,
      { page?: number; limit?: number; status?: JobListing['status'] }
    >({
      query: ({ page = 1, limit = 10, status } = {}) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/jobs`,
        params: { page, limit, ...(status && { status }) },
      }),
      providesTags: ['Jobs'],
    }),

    /** GET /companies/me/jobs/:id */
    getCompanyJobById: builder.query<JobListing, string>({
      query: (id) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Jobs', id }],
    }),

    /** POST /companies/me/jobs */
    createJob: builder.mutation<JobListing, CreateJobRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/jobs`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Jobs'],
    }),

    /** PATCH /companies/me/jobs/:id */
    updateJob: builder.mutation<JobListing, { id: string } & UpdateJobRequest>({
      query: ({ id, ...body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/jobs/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Jobs', id }, 'Jobs'],
    }),

    /** DELETE /companies/me/jobs/:id */
    deleteJob: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Jobs'],
    }),

    /** GET /companies/me/candidates */
    getCompanyCandidates: builder.query<
      Paginated<JobApplication>,
      {
        page?: number
        limit?: number
        jobId?: string
        status?: JobApplication['status']
      }
    >({
      query: ({ page = 1, limit = 10, jobId, status } = {}) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/candidates`,
        params: {
          page,
          limit,
          ...(jobId && { job_id: jobId }),
          ...(status && { status }),
        },
      }),
      providesTags: ['Candidates'],
    }),

    /** PATCH /companies/me/candidates/:applicationId/status */
    updateCandidateStatus: builder.mutation<
      JobApplication,
      { applicationId: string; status: JobApplication['status'] }
    >({
      query: ({ applicationId, status }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/candidates/${applicationId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Candidates', 'Applications'],
    }),

    /** POST /companies/register — stage company details and resend verification email */
    registerCompany: builder.mutation<EmptyResponse, RegisterCompanyRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/register`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Company'],
    }),

    /** POST /companies/join-request — request to join an existing company */
    requestJoinCompany: builder.mutation<EmptyResponse, JoinCompanyRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/join-request`,
        method: 'POST',
        body,
      }),
    }),

    // -----------------------------------------------------------------------
    // Recruiter management (company admin only)
    // -----------------------------------------------------------------------

    /** GET /companies/me/recruiters */
    getCompanyRecruiters: builder.query<ApiResponse<RecruiterMember[]>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/recruiters`,
      providesTags: ['Company'],
    }),

    /** PATCH /companies/me/recruiters/:membershipId/status */
    updateRecruiterStatus: builder.mutation<
      ApiResponse<RecruiterMember>,
      { membershipId: string; status: 'active' | 'rejected' }
    >({
      query: ({ membershipId, status }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/recruiters/${membershipId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Company'],
    }),

    /** DELETE /companies/me/recruiters/:membershipId */
    removeRecruiter: builder.mutation<EmptyResponse, string>({
      query: (membershipId) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/recruiters/${membershipId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Company'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetMyCompanyQuery,
  useUpdateCompanyMutation,
  useGetCompanyJobsQuery,
  useGetCompanyJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetCompanyCandidatesQuery,
  useUpdateCandidateStatusMutation,
  useRegisterCompanyMutation,
  useRequestJoinCompanyMutation,
  useGetCompanyRecruitersQuery,
  useUpdateRecruiterStatusMutation,
  useRemoveRecruiterMutation,
} = companyApi
