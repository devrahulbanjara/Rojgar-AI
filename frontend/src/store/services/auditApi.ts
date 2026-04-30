import { type ApiResponse, baseApi } from './baseApi'

export interface AuditLogItem {
  id: string
  actor_user_id: string | null
  actor_role: string | null
  target_user_id: string | null
  company_id: string | null
  entity_type: string
  entity_id: string | null
  parent_entity_type: string | null
  parent_entity_id: string | null
  action_type: string
  category: string | null
  message: string | null
  request_id: string | null
  request_path: string | null
  request_method: string | null
  ip_address: string | null
  user_agent: string | null
  source: string
  reason: string | null
  success: boolean
  error_message: string | null
  before_json: Record<string, unknown> | null
  after_json: Record<string, unknown> | null
  diff_json: Record<string, { before: unknown; after: unknown }> | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type CompanyAuditParams = {
  limit?: number
  category?: string
  actor_user_id?: string
  start_at?: string
  end_at?: string
}

export const AUDIT_CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'auth', label: 'Auth & Access' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'interviews', label: 'Interviews' },
] as const

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyAuditLogs: builder.query<ApiResponse<AuditLogItem[]>, CompanyAuditParams | void>({
      query: (params) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/audit/company`,
        params: params ?? undefined,
      }),
      providesTags: ['Audit'],
    }),
    getEntityAuditTrail: builder.query<
      ApiResponse<AuditLogItem[]>,
      { entityType: string; entityId: string }
    >({
      query: ({ entityType, entityId }) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/audit/entity/${entityType}/${entityId}`,
      }),
      providesTags: (_result, _error, arg) => [
        { type: 'Audit', id: `${arg.entityType}:${arg.entityId}` },
      ],
    }),
  }),
})

export const { useGetCompanyAuditLogsQuery, useGetEntityAuditTrailQuery } = auditApi
