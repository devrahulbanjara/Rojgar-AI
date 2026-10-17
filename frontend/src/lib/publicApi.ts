/**
 * Client for the no-account endpoints (/public/*, /me/applications).
 * Works in server and client components. In development, if the backend does
 * not have a route yet (FastAPI's bare {"detail":"Not Found"}), a small mock is
 * returned so the pages stay usable; production never mocks.
 */
import type { ApplicationStatus } from '@/store/services/applicationsApi'

import { publicApiMock } from './publicApiMock'

export type LocationType = 'remote' | 'hybrid' | 'onsite'
export type ApplySource = 'linkedin' | 'facebook' | 'merojob' | 'direct' | 'other'

export type PublicCompany = {
  name: string
  slug: string
  logo_url?: string | null
  website_url?: string | null
  location?: string | null
  industry?: string | null
  description?: string | null
}

export type PublicJobSummary = {
  slug: string
  title: string
  location?: string | null
  location_type: LocationType
  salary_min?: number | null
  salary_max?: number | null
  currency: string
  posted_at: string
  expires_at?: string | null
}

export type PublicJob = PublicJobSummary & {
  company: PublicCompany
  overview?: string | null
  responsibilities: string[]
  requirements: string[]
  preferred_qualifications: string[]
  benefits: string[]
  screening_questions: string[]
}

export type CareersPage = { company: PublicCompany; jobs: PublicJobSummary[] }

export type CvPrefill = {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
}

export type GuestApplicationCreated = {
  application_id: string
  job_title: string
  company_name: string
  email: string
  status_link_sent: boolean
}

export type ApplicationStatusView = {
  application_id: string
  job_title: string
  job_slug: string
  company_name: string
  company_slug: string
  status: ApplicationStatus
  status_label: string
  next_step?: string | null
  applied_at: string
  updated_at: string
  can_withdraw: boolean
}

export type MyApplication = Omit<ApplicationStatusView, 'can_withdraw'> & {
  company_logo_url?: string | null
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
const CAN_MOCK = process.env.NODE_ENV !== 'production'

type Envelope<T> = {
  success?: boolean
  data?: T
  message?: string
  errors?: Array<{ code?: string; message?: string } | null> | null
  detail?: unknown
}

async function request<T>(path: string, init?: RequestInit, mockKey?: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { credentials: 'include', cache: 'no-store', ...init })
  } catch {
    throw new PublicApiError('Could not reach the server. Check your connection.', 0)
  }
  const body = (await res.json().catch(() => ({}))) as Envelope<T>

  // Route not deployed yet (bare FastAPI 404) → dev mock.
  if (res.status === 404 && body.detail === 'Not Found' && CAN_MOCK && mockKey) {
    return publicApiMock<T>(mockKey, path, init)
  }
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

export const publicApi = {
  job: (slug: string) =>
    request<PublicJob>(`/public/jobs/${encodeURIComponent(slug)}`, undefined, 'job'),

  careers: (companySlug: string) =>
    request<CareersPage>(
      `/public/companies/${encodeURIComponent(companySlug)}/jobs`,
      undefined,
      'careers',
    ),

  prefill: (cv: File) => {
    const form = new FormData()
    form.append('cv', cv)
    return request<CvPrefill>('/public/cv-prefill', { method: 'POST', body: form }, 'prefill')
  },

  apply: (
    slug: string,
    input: {
      fullName: string
      email: string
      phone?: string
      cv: File
      answers: { question: string; answer: string }[]
      src: ApplySource
      turnstileToken?: string
    },
  ) => {
    const form = new FormData()
    form.append('full_name', input.fullName)
    form.append('email', input.email)
    if (input.phone) form.append('phone', input.phone)
    form.append('cv', input.cv)
    form.append('consent', 'true')
    if (input.answers.length) form.append('answers', JSON.stringify(input.answers))
    form.append('src', input.src)
    if (input.turnstileToken) form.append('turnstile_token', input.turnstileToken)
    return request<GuestApplicationCreated>(
      `/public/jobs/${encodeURIComponent(slug)}/applications`,
      { method: 'POST', body: form },
      'apply',
    )
  },

  status: (token: string) =>
    request<ApplicationStatusView>(
      `/public/applications/status?token=${encodeURIComponent(token)}`,
      undefined,
      'status',
    ),

  withdraw: (token: string) =>
    request<{ withdrawn: boolean; data_deleted: boolean }>(
      '/public/applications/withdraw',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      },
      'withdraw',
    ),

  magicLink: (email: string) =>
    request<{ sent: boolean }>(
      '/public/auth/magic-link',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
      'magicLink',
    ),

  myApplications: (accessToken?: string) =>
    request<MyApplication[]>(
      '/me/applications',
      accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
      'myApplications',
    ),
}

export const APPLY_SOURCES: ApplySource[] = ['linkedin', 'facebook', 'merojob', 'direct', 'other']

export function toApplySource(value: string | null | undefined): ApplySource {
  return APPLY_SOURCES.includes(value as ApplySource) ? (value as ApplySource) : 'direct'
}
