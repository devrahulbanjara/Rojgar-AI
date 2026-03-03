import { baseApi, type ApiResponse } from "./baseApi";
import type {
  CompanyProfile,
  UpdateCompanyProfileRequest,
  JobListing,
  CreateJobRequest,
  UpdateJobRequest,
  JobApplication,
  Paginated,
} from "@/lib/types/user";

// Re-export canonical types for components that import from this file
export type {
  CompanyProfile,
  JobListing,
  CreateJobRequest,
  UpdateJobRequest,
  JobApplication,
  Paginated,
};

// ---------------------------------------------------------------------------
// Company registration & join-request types
// ---------------------------------------------------------------------------

export interface RegisterCompanyRequest {
  company_name: string;
  industry: string;
  company_size: string;
  website?: string;
  description?: string;
  location?: string;
}

export interface JoinCompanyRequest {
  company_name: string;
  message?: string;
}

type EmptyResponse = ApiResponse<null>;

// ---------------------------------------------------------------------------
// Company API
// ---------------------------------------------------------------------------

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /company/me */
    getMyCompany: builder.query<CompanyProfile, void>({
      query: () => "/company/me",
      providesTags: ["Company"],
    }),

    /** PATCH /company/me */
    updateCompany: builder.mutation<
      CompanyProfile,
      UpdateCompanyProfileRequest
    >({
      query: (body) => ({
        url: "/company/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Company"],
    }),

    /** GET /company/me/jobs */
    getCompanyJobs: builder.query<
      Paginated<JobListing>,
      { page?: number; limit?: number; status?: JobListing["status"] }
    >({
      query: ({ page = 1, limit = 10, status } = {}) => ({
        url: "/company/me/jobs",
        params: { page, limit, ...(status && { status }) },
      }),
      providesTags: ["Jobs"],
    }),

    /** GET /company/me/jobs/:id */
    getCompanyJobById: builder.query<JobListing, string>({
      query: (id) => `/company/me/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Jobs", id }],
    }),

    /** POST /company/me/jobs */
    createJob: builder.mutation<JobListing, CreateJobRequest>({
      query: (body) => ({
        url: "/company/me/jobs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Jobs"],
    }),

    /** PATCH /company/me/jobs/:id */
    updateJob: builder.mutation<JobListing, { id: string } & UpdateJobRequest>({
      query: ({ id, ...body }) => ({
        url: `/company/me/jobs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Jobs", id },
        "Jobs",
      ],
    }),

    /** DELETE /company/me/jobs/:id */
    deleteJob: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/company/me/jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Jobs"],
    }),

    /** GET /company/me/candidates */
    getCompanyCandidates: builder.query<
      Paginated<JobApplication>,
      {
        page?: number;
        limit?: number;
        jobId?: string;
        status?: JobApplication["status"];
      }
    >({
      query: ({ page = 1, limit = 10, jobId, status } = {}) => ({
        url: "/company/me/candidates",
        params: {
          page,
          limit,
          ...(jobId && { job_id: jobId }),
          ...(status && { status }),
        },
      }),
      providesTags: ["Candidates"],
    }),

    /** PATCH /company/me/candidates/:applicationId/status */
    updateCandidateStatus: builder.mutation<
      JobApplication,
      { applicationId: string; status: JobApplication["status"] }
    >({
      query: ({ applicationId, status }) => ({
        url: `/company/me/candidates/${applicationId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Candidates", "Applications"],
    }),

    /** POST /company/register — create a new company and set current user as admin */
    registerCompany: builder.mutation<
      ApiResponse<CompanyProfile>,
      RegisterCompanyRequest
    >({
      query: (body) => ({
        url: "/company/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Company"],
    }),

    /** POST /company/join-request — request to join an existing company */
    requestJoinCompany: builder.mutation<EmptyResponse, JoinCompanyRequest>({
      query: (body) => ({
        url: "/company/join-request",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

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
} = companyApi;
