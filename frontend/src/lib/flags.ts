/**
 * Features whose backend is still being built. Turn one on with
 * NEXT_PUBLIC_FLAG_<NAME>=1 once the endpoints exist; until then the
 * adapters in lib/api fall back to what the current backend offers.
 */
export const FLAGS = {
  /** Native scheduling (B2): availability, self-booking link, scorecards. */
  nativeScheduling: process.env.NEXT_PUBLIC_FLAG_NATIVE_SCHEDULING === '1',
  /** GET /company/plan (B2): plan name and usage for admins. */
  companyPlan: process.env.NEXT_PUBLIC_FLAG_COMPANY_PLAN === '1',
} as const
