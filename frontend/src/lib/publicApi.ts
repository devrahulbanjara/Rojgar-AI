/**
 * Client for the no-account endpoints (/public/*, /me/applications).
 * Works in server and client components.
 */
export type LocationType = 'remote' | 'hybrid' | 'onsite'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship'
export type JobCategory =
  | 'banking_finance'
  | 'healthcare'
  | 'education'
  | 'hospitality_tourism'
  | 'sales_retail'
  | 'manufacturing'
  | 'logistics_driving'
  | 'it_software'
  | 'ngo_ingo'
  | 'government_public'
  | 'office_admin'
  | 'construction_engineering'
  | 'other'
export type QuestionType = 'short_text' | 'yes_no'
export type ApplySource =
  | 'linkedin'
  | 'facebook'
  | 'merojob'
  | 'viber'
  | 'qr'
  | 'referral'
  | 'direct'
  | 'other'

/** What an applicant sees. Never shows the AI review. */
export type Stage =
  | 'new'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'not_selected'
  | 'withdrawn'

export type PublicCompany = {
  name: string
  slug: string
  logo_url?: string | null
  website_url?: string | null
  location?: string | null
  industry?: string | null
  description?: string | null
  /** Shown on the job page, careers page and poster. */
  phone?: string | null
  /** Approved by platform staff: "Verified business". */
  verified: boolean
}

export type PublicCategory = { value: JobCategory; label: string }

export type PublicJobSummary = {
  slug: string
  title: string
  location?: string | null
  location_type: LocationType
  category: PublicCategory
  employment_type: EmploymentType
  salary_min?: number | null
  salary_max?: number | null
  currency: string
  posted_at: string
  closes_at?: string | null
}

/** Apply-form question. */
export type PublicQuestion = { label: string; type: QuestionType; required: boolean }

export type PublicJob = PublicJobSummary & {
  company: PublicCompany
  /** Markdown. */
  description: string
  must_haves: string[]
  nice_to_haves: string[]
  questions: PublicQuestion[]
  /** Name of the person whose share link was opened (?ref=). */
  shared_by?: string | null
}

export type ReportReason = 'fee_requested' | 'fake' | 'discriminatory' | 'other'

export type CareersPage = { company: PublicCompany; jobs: PublicJobSummary[] }

export type CvPrefill = {
  full_name?: string | null
  email?: string | null
  phone?: string | null
}

export type GuestApplicationCreated = {
  application_id: string
  job_title: string
  company_name: string
  phone: string
  email?: string | null
  status_link_sent: boolean
  /** Private link to this application's status page, for the applicant to keep. */
  status_url?: string | null
}

export type InterviewInfo = {
  starts_at: string
  ends_at: string
  location?: string | null
  join_url?: string | null
}

export type ApplicationStatusView = {
  application_id: string
  job_title: string
  job_slug: string
  company_name: string
  company_slug: string
  stage: Stage
  interview?: InterviewInfo | null
  applied_at: string
  updated_at: string
  can_withdraw: boolean
}

export type MyApplication = Omit<ApplicationStatusView, 'can_withdraw'> & {
  company_logo_url?: string | null
  /** Opens this application's status page. */
  status_token: string
}

export type WithdrawResult = { withdrawn: boolean; data_deleted: boolean }
export type RecommendSent = {
  sent: boolean
  /** The suggested person's own apply link, for the suggester to send them. */
  job_url?: string | null
}
export type MagicLinkSent = { sent: boolean }
export type ScreeningAnswer = { question: string; answer: string }

export type RecommendInput = {
  referrerName: string
  referrerPhone?: string
  name: string
  phone: string
  note?: string
  ref?: string
}

export class PublicApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
  }
}

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

type Envelope<T> = {
  success?: boolean
  data?: T
  message?: string
  errors?: Array<{ code?: string; message?: string } | null> | null
  detail?: unknown
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { credentials: 'include', cache: 'no-store', ...init })
  } catch {
    throw new PublicApiError('Could not reach the server. Check your connection.', 0)
  }
  const body = (await res.json().catch(() => ({}))) as Envelope<T>

  if (!res.ok || body.success === false) {
    const first = body.errors?.[0]
    const message =
      first?.message ??
      body.message ??
      (typeof body.detail === 'string' ? body.detail : 'Something went wrong. Try again.')
    throw new PublicApiError(message, res.status, first?.code)
  }
  return body.data as T
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const publicApi = {
  job: (slug: string, ref?: string) =>
    request<PublicJob>(
      `/public/jobs/${encodeURIComponent(slug)}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`,
    ),

  report: (slug: string, input: { reason: ReportReason; details?: string }) =>
    request<null>(
      `/public/jobs/${encodeURIComponent(slug)}/report`,
      json({ reason: input.reason, details: input.details || null }),
    ),

  careers: (companySlug: string) =>
    request<CareersPage>(`/public/companies/${encodeURIComponent(companySlug)}/jobs`),

  prefill: (cv: File) => {
    const form = new FormData()
    form.append('cv', cv)
    return request<CvPrefill>('/public/cv-prefill', { method: 'POST', body: form })
  },

  apply: (
    slug: string,
    input: {
      fullName: string
      phone: string
      email?: string
      cv?: File | null
      answers: ScreeningAnswer[]
      src: ApplySource
      ref?: string
      turnstileToken?: string
    },
  ) => {
    const form = new FormData()
    form.append('full_name', input.fullName)
    form.append('phone', input.phone)
    if (input.email) form.append('email', input.email)
    if (input.cv) form.append('cv', input.cv)
    form.append('consent', 'true')
    if (input.answers.length) form.append('answers', JSON.stringify(input.answers))
    form.append('src', input.src)
    if (input.ref) form.append('ref', input.ref)
    if (input.turnstileToken) form.append('turnstile_token', input.turnstileToken)
    return request<GuestApplicationCreated>(
      `/public/jobs/${encodeURIComponent(slug)}/applications`,
      { method: 'POST', body: form },
    )
  },

  recommend: (slug: string, input: RecommendInput) =>
    request<RecommendSent>(
      `/public/jobs/${encodeURIComponent(slug)}/recommend`,
      json({
        referrer_name: input.referrerName,
        referrer_phone: input.referrerPhone || null,
        name: input.name,
        phone: input.phone,
        note: input.note || null,
        ref: input.ref || null,
      }),
    ),

  status: (token: string) =>
    request<ApplicationStatusView>(
      `/public/applications/status?token=${encodeURIComponent(token)}`,
    ),

  withdraw: (token: string) =>
    request<WithdrawResult>('/public/applications/withdraw', json({ token })),

  magicLink: (email: string) => request<MagicLinkSent>('/public/auth/magic-link', json({ email })),

  myApplications: (accessToken?: string) =>
    request<MyApplication[]>(
      '/me/applications',
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    ),
}

export const APPLY_SOURCES: ApplySource[] = [
  'linkedin',
  'facebook',
  'merojob',
  'viber',
  'qr',
  'referral',
  'direct',
  'other',
]

export function toApplySource(value: string | null | undefined): ApplySource {
  return APPLY_SOURCES.includes(value as ApplySource) ? (value as ApplySource) : 'direct'
}

/** A share-link token from ?ref= (the backend issues 16 URL-safe characters), else undefined. */
export function toRefToken(value: string | null | undefined): string | undefined {
  const token = value?.trim()
  return token && /^[A-Za-z0-9_-]{1,32}$/.test(token) ? token : undefined
}
