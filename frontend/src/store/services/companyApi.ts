import type { BusinessRole, BusinessStatus } from '@/lib/types/user'

import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Business, team and invite types
// ---------------------------------------------------------------------------

export interface BusinessOptions {
  types: string[]
  /** All 77 districts of Nepal. */
  districts: string[]
}

export interface TeamMember {
  membership_id: string
  user_id: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: BusinessRole
  joined_at: string
}

export interface Invite {
  id: string
  role: BusinessRole
  expires_at: string
  created_at: string
  created_by_name: string | null
}

export interface CreatedInvite extends Invite {
  /** Shown once: only a hash of the token is kept. */
  url: string
}

export interface InvitePreview {
  business_name: string
  role: BusinessRole
  invited_by: string | null
  /** Why the link can't be used (expired, used, cancelled). */
  problem: string | null
}

export interface CompanyMediaData {
  id: string
  name: string
  logo_url: string | null
  industry: string | null
  company_size: string | null
  location: string | null
  website_url: string | null
  cal_organizer_email: string | null
  description: string | null
  slug: string
  district: string | null
  phone: string | null
  pan_number: string | null
  status: BusinessStatus
  status_reason: string | null
  verified: boolean
  has_registration_doc: boolean
  created_at: string
  updated_at: string
}

export type CompanyProfileData = CompanyMediaData

export interface UpdateCompanyRequest {
  name?: string | null
  industry?: string | null
  company_size?: string | null
  location?: string | null
  website_url?: string | null
  cal_organizer_email?: string | null
  description?: string | null
}

type EmptyResponse = ApiResponse<null>
type CompanyMediaResponse = ApiResponse<CompanyMediaData>
type CompanyProfileResponse = ApiResponse<CompanyProfileData>

// ---------------------------------------------------------------------------
// Company API
// ---------------------------------------------------------------------------

export const companyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /companies/me */
    getMyCompany: builder.query<CompanyProfileResponse, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me`,
      providesTags: ['Company'],
    }),

    /** PATCH /companies/me */
    updateCompany: builder.mutation<CompanyProfileResponse, UpdateCompanyRequest>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Company'],
    }),

    uploadCompanyLogo: builder.mutation<CompanyMediaResponse, FormData>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/logo`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Company'],
    }),

    removeCompanyLogo: builder.mutation<EmptyResponse, void>({
      query: () => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/me/logo`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Company'],
    }),

    /** GET /businesses/options — business types and districts. */
    getBusinessOptions: builder.query<ApiResponse<BusinessOptions>, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/options`,
      keepUnusedDataFor: 3600,
    }),

    /** POST /businesses (multipart) — pending until Rojgar AI approves it. */
    createBusiness: builder.mutation<CompanyProfileResponse, FormData>({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Company', 'User'],
    }),

    /** POST /businesses/:id/verification (multipart) — PAN and certificate. */
    updateVerification: builder.mutation<
      CompanyProfileResponse,
      { businessId: string; body: FormData }
    >({
      query: ({ businessId, body }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${businessId}/verification`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Company', 'User'],
    }),

    getTeam: builder.query<ApiResponse<TeamMember[]>, string>({
      query: (businessId) =>
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${businessId}/members`,
      providesTags: ['Team'],
    }),

    changeMemberRole: builder.mutation<
      ApiResponse<TeamMember>,
      { businessId: string; membershipId: string; role: BusinessRole }
    >({
      query: ({ businessId, membershipId, role }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${businessId}/members/${membershipId}`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['Team'],
    }),

    removeMember: builder.mutation<EmptyResponse, { businessId: string; membershipId: string }>({
      query: ({ businessId, membershipId }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${businessId}/members/${membershipId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Team'],
    }),

    getInvites: builder.query<ApiResponse<Invite[]>, string>({
      query: (businessId) =>
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${businessId}/invites`,
      providesTags: ['Team'],
    }),

    createInvite: builder.mutation<
      ApiResponse<CreatedInvite>,
      { businessId: string; role: BusinessRole }
    >({
      query: ({ businessId, role }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${businessId}/invites`,
        method: 'POST',
        body: { role },
      }),
      invalidatesTags: ['Team'],
    }),

    revokeInvite: builder.mutation<EmptyResponse, { businessId: string; inviteId: string }>({
      query: ({ businessId, inviteId }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${businessId}/invites/${inviteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Team'],
    }),

    /** GET /invites/:token — works without signing in. */
    getInvitePreview: builder.query<ApiResponse<InvitePreview>, string>({
      query: (token) => `${process.env.NEXT_PUBLIC_BACKEND_URL}/invites/${token}`,
    }),

    acceptInvite: builder.mutation<ApiResponse<{ business_id: string }>, string>({
      query: (token) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/invites/${token}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Company', 'Team'],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
})

export const {
  useGetMyCompanyQuery,
  useUpdateCompanyMutation,
  useUploadCompanyLogoMutation,
  useRemoveCompanyLogoMutation,
  useGetBusinessOptionsQuery,
  useCreateBusinessMutation,
  useUpdateVerificationMutation,
  useGetTeamQuery,
  useChangeMemberRoleMutation,
  useRemoveMemberMutation,
  useGetInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
  useGetInvitePreviewQuery,
  useAcceptInviteMutation,
} = companyApi
