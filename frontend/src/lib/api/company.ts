/**
 * Company plan and usage. Behind FLAGS.companyPlan until B2 ships
 * GET /company/plan → { name, usage: [{ label, used, limit }] }.
 * With the flag off the query returns null and the UI hides the plan.
 */
import { FLAGS } from '@/lib/flags'
import { type ApiResponse, baseApi } from '@/store/services/baseApi'

export interface PlanUsage {
  /** "Open jobs", "Team members", "Applications this month" */
  label: string
  used: number
  /** null = unlimited */
  limit: number | null
}

export interface CompanyPlan {
  name: string
  usage: PlanUsage[]
}

export const companyPlanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyPlan: builder.query<CompanyPlan | null, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        if (!FLAGS.companyPlan) return { data: null }
        const res = await baseQuery(`${process.env.NEXT_PUBLIC_BACKEND_URL}/company/plan`)
        if (res.error) return { error: res.error }
        return { data: (res.data as ApiResponse<CompanyPlan>).data }
      },
      providesTags: ['CompanyPlan'],
    }),
  }),
})

export const { useGetCompanyPlanQuery } = companyPlanApi
