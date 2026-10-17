/** Company plan and usage, from GET /company/plan. */
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

interface ApiPlan {
  plan: 'free' | 'team' | 'business'
  limits: {
    active_jobs: number | null
    reviews_per_month: number | null
    recruiters: number | null
  }
  usage: { active_jobs: number; reviews_this_month: number; recruiters: number }
  passes: {
    job_title: string
    reviews_included: number
    reviews_used: number
    expires_at: string | null
    active: boolean
  }[]
}

function endOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
}

function fromApi(data: ApiPlan): CompanyPlan {
  return {
    plan: data.plan,
    usage: [
      ...data.passes
        .filter((pass) => pass.active)
        .map((pass) => ({
          label: pass.job_title,
          used: pass.reviews_used,
          limit: pass.reviews_included,
          unit: 'reviews',
          ends_at: pass.expires_at,
        })),
      {
        label: 'This month',
        used: data.usage.reviews_this_month,
        limit: data.limits.reviews_per_month,
        unit: 'reviews',
        ends_at: endOfMonth(),
      },
      {
        label: 'Open jobs',
        used: data.usage.active_jobs,
        limit: data.limits.active_jobs,
        unit: 'open jobs',
        ends_at: null,
      },
      {
        label: 'Team',
        used: data.usage.recruiters,
        limit: data.limits.recruiters,
        unit: 'team members',
        ends_at: null,
      },
    ],
  }
}

export const companyPlanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyPlan: builder.query<CompanyPlan, void>({
      query: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/company/plan`,
      transformResponse: (res: ApiResponse<ApiPlan>) => fromApi(res.data),
      providesTags: ['CompanyPlan'],
    }),
  }),
})

export const { useGetCompanyPlanQuery } = companyPlanApi
