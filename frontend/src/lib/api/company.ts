/**
 * Company plan and usage. Behind FLAGS.companyPlan until B2 ships
 * GET /company/plan → CompanyPlan. With the flag off the query returns null
 * and the UI hides the plan.
 */
import { FLAGS } from '@/lib/flags'
import { type ApiResponse, baseApi } from '@/store/services/baseApi'
import { format } from 'date-fns'

export type PlanId = 'free' | 'job_pass' | 'job_pass_plus' | 'team' | 'business'

/** Prices in NPR before 13% VAT. */
export const PLANS: Record<PlanId, { name: string; price: number; per: 'job' | 'month' | null }> = {
  free: { name: 'Free', price: 0, per: null },
  job_pass: { name: 'Job Pass', price: 999, per: 'job' },
  job_pass_plus: { name: 'Job Pass Plus', price: 2499, per: 'job' },
  team: { name: 'Team', price: 3499, per: 'month' },
  business: { name: 'Business', price: 9999, per: 'month' },
}

export interface PlanUsage {
  /** What the allowance covers: "This job", "This month", "Senior Accountant" */
  label: string
  used: number
  /** null = unlimited */
  limit: number | null
  /** "reviews", "open jobs", "team members" */
  unit: string
  /** When the allowance ends or renews. */
  ends_at: string | null
}

export interface CompanyPlan {
  plan: PlanId
  usage: PlanUsage[]
}

/** "NPR 999 per job + 13% VAT" · "Free" */
export function planPrice(plan: PlanId): string {
  const { price, per } = PLANS[plan]
  if (!price) return 'Free'
  return `NPR ${price.toLocaleString('en-IN')} ${per === 'job' ? 'per job' : 'a month'} + 13% VAT`
}

/** "This job: 34 of 100 reviews used · ends 30 Nov" */
export function usageLine(usage: PlanUsage): string {
  const amount =
    usage.limit === null
      ? `${usage.used} ${usage.unit} used`
      : `${usage.used} of ${usage.limit} ${usage.unit} used`
  const ends = usage.ends_at ? ` · ends ${format(new Date(usage.ends_at), 'd MMM')}` : ''
  return `${usage.label}: ${amount}${ends}`
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
