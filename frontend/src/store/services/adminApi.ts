import type { BusinessStatus } from '@/lib/types/user'

import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Platform staff (/admin). Field names mirror app/modules/admin/schemas.py.
// ---------------------------------------------------------------------------

export interface ApprovalItem {
  id: string
  name: string
  business_type: string | null
  district: string | null
  phone: string | null
  pan_number: string | null
  /** Short-lived link to the private certificate file. */
  document_url: string | null
  document_is_pdf: boolean
  created_by_name: string | null
  created_by_contact: string | null
  /** Set after "Ask for more info"; the business is still pending. */
  info_requested: string | null
  created_at: string
}

export interface BusinessRow {
  id: string
  name: string
  slug: string
  business_type: string | null
  district: string | null
  status: BusinessStatus
  status_reason: string | null
  plan: string
  members: number
  jobs: number
  open_reports: number
  created_at: string
}

export type ReportReason = 'fee_requested' | 'fake' | 'discriminatory' | 'other'

export interface ReportItem {
  id: string
  source: 'applicant' | 'auto'
  reason: ReportReason
  details: string | null
  created_at: string
}

export interface FlaggedJob {
  job_id: string
  job_title: string
  job_slug: string
  business_id: string
  business_name: string
  business_status: BusinessStatus
  unpublished: boolean
  reports: ReportItem[]
  latest_at: string
}

export interface PaymentRow {
  id: string
  business_id: string
  business_name: string
  kind: 'job_pass' | 'job_pass_plus' | 'team' | 'business' | 'top_up'
  item: string
  job_title: string | null
  amount_npr: number
  reference: string | null
  status: 'awaiting' | 'received'
  created_at: string
  received_at: string | null
}

export interface PaidPlanRow {
  business_id: string
  business_name: string
  plan: string
  active_passes: number
}

export interface PaymentsOverview {
  transfers: PaymentRow[]
  /** Businesses on a paid plan or with a live Job Pass. */
  paid: PaidPlanRow[]
}

type Empty = ApiResponse<null>
const API = process.env.NEXT_PUBLIC_BACKEND_URL

const post = (url: string, body?: object) => ({ url: `${API}${url}`, method: 'POST', body })

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApprovals: builder.query<ApiResponse<ApprovalItem[]>, void>({
      query: () => `${API}/admin/approvals`,
      providesTags: [{ type: 'Admin', id: 'approvals' }],
    }),
    approveBusiness: builder.mutation<Empty, string>({
      query: (id) => post(`/admin/businesses/${id}/approve`),
      invalidatesTags: ['Admin'],
    }),
    requestBusinessInfo: builder.mutation<Empty, { id: string; message: string }>({
      query: ({ id, message }) => post(`/admin/businesses/${id}/request-info`, { message }),
      invalidatesTags: ['Admin'],
    }),
    rejectBusiness: builder.mutation<Empty, { id: string; reason: string }>({
      query: ({ id, reason }) => post(`/admin/businesses/${id}/reject`, { reason }),
      invalidatesTags: ['Admin'],
    }),

    getBusinesses: builder.query<ApiResponse<BusinessRow[]>, void>({
      query: () => `${API}/admin/businesses`,
      providesTags: [{ type: 'Admin', id: 'businesses' }],
    }),
    suspendBusiness: builder.mutation<Empty, { id: string; reason: string }>({
      query: ({ id, reason }) => post(`/admin/businesses/${id}/suspend`, { reason }),
      invalidatesTags: ['Admin'],
    }),
    restoreBusiness: builder.mutation<Empty, string>({
      query: (id) => post(`/admin/businesses/${id}/restore`),
      invalidatesTags: ['Admin'],
    }),

    /** Open reports; with `includeResolved`, also jobs already handled. */
    getReports: builder.query<ApiResponse<FlaggedJob[]>, { includeResolved: boolean }>({
      query: ({ includeResolved }) => ({
        url: `${API}/admin/reports`,
        params: includeResolved ? { include_resolved: true } : undefined,
      }),
      providesTags: [{ type: 'Admin', id: 'reports' }],
    }),
    unpublishJob: builder.mutation<Empty, { jobId: string; reason?: string }>({
      query: ({ jobId, reason }) =>
        post(`/admin/jobs/${jobId}/unpublish`, { reason: reason ?? null }),
      invalidatesTags: ['Admin'],
    }),
    restoreJob: builder.mutation<Empty, string>({
      query: (jobId) => post(`/admin/jobs/${jobId}/restore`),
      invalidatesTags: ['Admin'],
    }),
    dismissReports: builder.mutation<Empty, string>({
      query: (jobId) => post(`/admin/jobs/${jobId}/dismiss`),
      invalidatesTags: ['Admin'],
    }),

    getPayments: builder.query<ApiResponse<PaymentsOverview>, void>({
      query: () => `${API}/admin/payments`,
      providesTags: [{ type: 'Admin', id: 'payments' }],
    }),
    markPaymentReceived: builder.mutation<Empty, { id: string; reference?: string }>({
      query: ({ id, reference }) =>
        post(`/admin/payments/${id}/received`, { reference: reference || null }),
      invalidatesTags: ['Admin'],
    }),
  }),
})

export const {
  useGetApprovalsQuery,
  useApproveBusinessMutation,
  useRequestBusinessInfoMutation,
  useRejectBusinessMutation,
  useGetBusinessesQuery,
  useSuspendBusinessMutation,
  useRestoreBusinessMutation,
  useGetReportsQuery,
  useUnpublishJobMutation,
  useRestoreJobMutation,
  useDismissReportsMutation,
  useGetPaymentsQuery,
  useMarkPaymentReceivedMutation,
} = adminApi
