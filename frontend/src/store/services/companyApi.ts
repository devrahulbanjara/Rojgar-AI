import type { CompanyProfile, RecruiterMember, UpdateCompanyProfileRequest } from '@/lib/types/user'

import { type ApiResponse, baseApi } from './baseApi'

// Re-export canonical types for components that import from this file
export type { CompanyProfile, RecruiterMember }

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
  overrideExisting: process.env.NODE_ENV !== 'production',
})

export const {
  useGetMyCompanyQuery,
  useUpdateCompanyMutation,
  useRegisterCompanyMutation,
  useRequestJoinCompanyMutation,
  useGetCompanyRecruitersQuery,
  useUpdateRecruiterStatusMutation,
  useRemoveRecruiterMutation,
} = companyApi
