/**
 * Recruiter adapter: the ONE module the job page, candidate panel and job
 * builder talk to. Screens only see the shapes below (RECRUITER_FLOW.md §3).
 *
 * Today every endpoint is implemented on top of the current backend
 * (8-value application status, 0–100 score, strengths/weaknesses, job arrays).
 * When the new endpoints land, swap the bodies here and flip CAPABILITIES;
 * nothing in the screens changes.
 */
import { formatSalary } from '@/lib/jobHelpers'
import { store } from '@/store'
import type { ApplicationStatus, RecruiterCandidateDetailView } from '@/store/services/applicationsApi'
import { type ApiResponse, baseApi } from '@/store/services/baseApi'
import { type JobAIDraftPayload, jobAiApi } from '@/store/services/jobAiApi'
import type { JobDetail, JobStatus as LegacyJobStatus } from '@/store/services/jobsApi'
import { updateAccessToken } from '@/store/slices/authSlice'
import type { FetchArgs } from '@reduxjs/toolkit/query'

type MaybePromise<T> = T | PromiseLike<T>

const API = process.env.NEXT_PUBLIC_BACKEND_URL

/** What the backend can do today. Flip these as the new endpoints ship. */
export const CAPABILITIES = {
  /** B3 assistant SSE endpoints (job draft streaming + "Ask about this candidate"). */
  assistant: false,
  /** POST notes on an application. */
  notes: false,
  /** Recruiter can mark an offer as hired (today only the candidate accepts). */
  markHired: false,
  /** Move a candidate back one stage / mark withdrawn. */
  withdraw: false,
  /** Recruiter can edit the invite email before it goes out. */
  editInviteEmail: false,
  /** Question type + required flag stored on the job. */
  questionTypes: false,
  /** job.category / job.employment_type stored by the backend (kept in this browser until then). */
  jobCategory: false,
  /** Recruiter adds a walk-in / phone / referral candidate. */
  addCandidate: false,
} as const

/** How long a decision's email waits so Undo can cancel it. */
export const UNDO_WINDOW_MS = 10_000

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type Stage = 'new' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'
export type CountedStage = Exclude<Stage, 'withdrawn'>
export type Fit = 'strong' | 'possible' | 'weak'
export type ReviewState = 'pending' | 'done' | 'failed' | 'needs_person'
export type PipelineSort = 'best_fit' | 'newest'
export type Source =
  | 'linkedin'
  | 'facebook'
  | 'merojob'
  | 'viber'
  | 'qr'
  | 'walk_in'
  | 'phone'
  | 'referral'
  | 'direct'
  | 'other'

export const SOURCE_LABEL: Record<Source, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  merojob: 'Merojob',
  viber: 'Viber',
  qr: 'QR code',
  walk_in: 'Walk-in',
  phone: 'Phone',
  referral: 'Referral',
  direct: 'Apply link',
  other: 'Other',
}

export type Person = {
  name: string
  email: string | null
  avatar_url: string | null
  phone?: string | null
}

export type PipelineItem = {
  application_id: string
  person: Person
  fit: Fit | null
  summary: string | null
  stage: Stage
  source: Source
  applied_at: string
  flagged: boolean
  flag_reason: string | null
  review_state: ReviewState
  /** Name of the person who recommended them (referral link), if any. */
  referred_by: string | null
  /** Must-haves met / checked. 0 checked = no must-have checks yet. */
  checks_met: number
  checks_total: number
}

export type Pipeline = { counts: Record<CountedStage, number>; items: PipelineItem[] }

export type CheckResult = 'met' | 'partly' | 'missing'
export type Check = { criterion: string; result: CheckResult; evidence: string | null }

export type CandidateEvent = {
  type:
    | 'applied'
    | 'stage_changed'
    | 'email_sent'
    | 'email_scheduled'
    | 'interview_booked'
    | 'interview_done'
    | 'note'
    | 'review_done'
  actor: string | null
  text: string
  created_at: string
}

/** Structured profile for applicants who applied with a platform profile instead of a file. */
export type CvOutline = {
  headline: string | null
  summary: string | null
  experiences: { title: string; company: string; period: string | null }[]
  educations: { title: string; period: string | null }[]
  skills: string[]
}

export type Candidate = {
  application_id: string
  job_id: string
  job_title: string
  person: Person & {
    phone: string | null
    location: string | null
    linkedin_url: string | null
  }
  stage: Stage
  source: Source
  referred_by: string | null
  applied_at: string
  review: {
    state: ReviewState
    fit: Fit | null
    summary: string | null
    checks: Check[]
    flag_reason: string | null
  }
  answers: { question: string; answer: string }[]
  cv_url: string | null
  cv_outline: CvOutline | null
  other_applications: { application_id: string; job_id: string; job_title: string; stage: Stage }[]
  events: CandidateEvent[]
}

export type DecisionAction =
  | 'shortlist'
  | 'reject'
  | 'invite'
  | 'offer'
  | 'hire'
  | 'move_back'
  | 'withdraw'

export type JobState = 'draft' | 'open' | 'closed'
export type WorkType = 'onsite' | 'hybrid' | 'remote'
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

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'banking_finance', label: 'Banking & Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality_tourism', label: 'Hospitality & Tourism' },
  { value: 'sales_retail', label: 'Sales & Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'logistics_driving', label: 'Logistics & Driving' },
  { value: 'it_software', label: 'IT & Software' },
  { value: 'ngo_ingo', label: 'NGO/INGO' },
  { value: 'government_public', label: 'Government & Public' },
  { value: 'office_admin', label: 'Office & Admin' },
  { value: 'construction_engineering', label: 'Construction & Engineering' },
  { value: 'other', label: 'Other' },
]

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

export const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]

export type JobQuestion = { label: string; type: 'short_text' | 'yes_no'; required: boolean }

export type Job = {
  id: string
  slug: string | null
  company_name: string
  title: string
  location: string | null
  work_type: WorkType
  employment_type: EmploymentType | null
  category: JobCategory | null
  salary_min: number | null
  salary_max: number | null
  currency: string
  description: string
  must_haves: string[]
  nice_to_haves: string[]
  questions: JobQuestion[]
  status: JobState
  closed_reason: 'hired' | 'cancelled' | 'expired' | null
  closes_at: string | null
  applicants: number
  updated_at: string
}

export type JobInput = Omit<
  Job,
  'id' | 'slug' | 'company_name' | 'closed_reason' | 'applicants' | 'updated_at'
> & { id?: string }

/** The fields a job draft (AI or pasted) can fill. */
export type JobDraft = Partial<
  Pick<
    Job,
    | 'title'
    | 'location'
    | 'work_type'
    | 'employment_type'
    | 'category'
    | 'salary_min'
    | 'salary_max'
    | 'currency'
    | 'description'
    | 'must_haves'
    | 'nice_to_haves'
  >
>

export type CandidateAnswer = {
  answer: string
  quotes: string[]
  suggested_action?: DecisionAction
}

// ---------------------------------------------------------------------------
// Mapping helpers (current backend → shapes)
// ---------------------------------------------------------------------------

export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Not now',
  withdrawn: 'Withdrawn',
}

export const FIT_LABEL: Record<Fit, string> = {
  strong: 'Fits',
  possible: 'Might fit',
  weak: "Doesn't fit yet",
}

const STATUS_TO_STAGE: Record<ApplicationStatus, Stage> = {
  applied: 'new',
  shortlisted: 'shortlisted',
  interview_booked: 'interview',
  interview_completed: 'interview',
  offer: 'offer',
  offer_accepted: 'hired',
  offer_declined: 'withdrawn',
  rejected: 'rejected',
}

export function fitFromScore(score: number | null | undefined): Fit | null {
  if (score == null) return null
  if (score >= 75) return 'strong'
  if (score >= 50) return 'possible'
  return 'weak'
}

function reviewState(status: string | null | undefined, score: number | null): ReviewState {
  if (status === 'pending') return 'pending'
  if (status === 'needs_human_review') return 'needs_person'
  if (status === 'failed') return 'failed'
  if (status === 'completed' || score != null) return 'done'
  return 'failed'
}

function toSource(source: string | null | undefined): Source {
  if (!source || source === 'platform') return 'direct'
  return source in SOURCE_LABEL ? (source as Source) : 'other'
}

/** First sentence of the first strength, ≤140 chars. */
function summaryFrom(strengths: string[] | null | undefined): string | null {
  const first = strengths?.find((s) => s.trim())?.trim()
  if (!first) return null
  const sentence = first.split(/(?<=[.!?])\s/)[0] ?? first
  return sentence.length > 140 ? `${sentence.slice(0, 137).trimEnd()}…` : sentence
}

const rawStatus = new Map<string, ApplicationStatus>()

// ---------------------------------------------------------------------------
// Decisions: queued for UNDO_WINDOW_MS, then committed. Undo cancels.
// The current backend sends the status email on PATCH, so holding the PATCH
// is what lets Undo stop the email.
// ---------------------------------------------------------------------------

type Pending = {
  eventId: string
  applicationId: string
  action: DecisionAction
  stage: Stage
  timer: ReturnType<typeof setTimeout>
}

const pending = new Map<string, Pending>()

function overlay<T extends { application_id: string; stage: Stage }>(item: T): T {
  for (const entry of pending.values()) {
    if (entry.applicationId === item.application_id) return { ...item, stage: entry.stage }
  }
  return item
}

const NEXT_STAGE: Record<DecisionAction, Stage> = {
  shortlist: 'shortlisted',
  reject: 'rejected',
  invite: 'interview',
  offer: 'offer',
  hire: 'hired',
  move_back: 'shortlisted',
  withdraw: 'withdrawn',
}

/** Status PATCHes the current backend needs for an action, given the current status. */
function legacyChain(action: DecisionAction, current: ApplicationStatus | undefined): ApplicationStatus[] {
  switch (action) {
    case 'shortlist':
    case 'move_back':
      return ['shortlisted']
    case 'reject':
      return ['rejected']
    case 'invite':
      return ['interview_booked']
    case 'offer':
      if (current === 'interview_booked') return ['interview_completed', 'offer']
      return ['offer']
    default:
      return []
  }
}

/** Decision buttons for a stage: `primary` are shown, `more` go in the "More" menu. */
export function actionsFor(stage: Stage): { primary: DecisionAction[]; more: DecisionAction[] } {
  switch (stage) {
    case 'new':
      return { primary: ['reject', 'shortlist'], more: [] }
    case 'shortlisted':
      return { primary: ['invite'], more: ['reject', ...(CAPABILITIES.withdraw ? (['withdraw'] as const) : [])] }
    case 'interview':
      return { primary: ['offer'], more: ['reject', ...(CAPABILITIES.withdraw ? (['withdraw'] as const) : [])] }
    case 'offer':
      return {
        primary: CAPABILITIES.markHired ? ['hire'] : [],
        more: ['reject', ...(CAPABILITIES.withdraw ? (['withdraw'] as const) : [])],
      }
    case 'rejected':
      return { primary: [], more: ['move_back'] }
    default:
      return { primary: [], more: [] }
  }
}

export const ACTION_LABEL: Record<DecisionAction, string> = {
  shortlist: 'Shortlist',
  reject: 'Not now',
  invite: 'Invite to interview',
  offer: 'Make offer',
  hire: 'Mark hired',
  move_back: 'Move back to shortlisted',
  withdraw: 'Withdraw',
}

/** Actions whose email waits in the undo window. */
export function sendsEmail(action: DecisionAction): boolean {
  return action === 'shortlist' || action === 'reject' || action === 'offer'
}

async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) =>
    fetch(url, {
      ...init,
      credentials: 'include',
      headers: {
        ...((init.headers as Record<string, string> | undefined) ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  const response = await send(store.getState().auth.accessToken)
  if (response.status !== 401) return response
  const refreshed = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!refreshed.ok) return response
  const body = (await refreshed.json()) as ApiResponse<{ access_token: string }>
  const token = body.data?.access_token
  if (!token) return response
  store.dispatch(updateAccessToken(token))
  return send(token)
}

async function commit(eventId: string) {
  const entry = pending.get(eventId)
  if (!entry) return
  clearTimeout(entry.timer)
  let failed = false
  try {
    for (const status of legacyChain(entry.action, rawStatus.get(entry.applicationId))) {
      const response = await authedFetch(`${API}/applications/${entry.applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        keepalive: true,
      })
      if (!response.ok) throw new Error(String(response.status))
      rawStatus.set(entry.applicationId, status)
    }
  } catch {
    failed = true
  } finally {
    pending.delete(eventId)
    store.dispatch(
      baseApi.util.invalidateTags([
        'Applications',
        'Candidates',
        'Jobs',
        { type: 'Candidates', id: entry.applicationId },
      ]),
    )
  }
  if (failed) {
    const { notify } = await import('@/lib/notify')
    notify.error("Couldn't save one decision. It's back where it was.")
  }
}

if (typeof window !== 'undefined') {
  // Leaving the page ends the undo window: send what's queued.
  window.addEventListener('pagehide', () => {
    for (const id of [...pending.keys()]) void commit(id)
  })
}

let eventSeq = 0

// ---------------------------------------------------------------------------
// Job mapping
// ---------------------------------------------------------------------------

const LOCAL_META_KEY = (id: string) => `rojgar:job-meta:${id}`
type LocalMeta = { category: JobCategory | null; employment_type: EmploymentType | null }

function readLocalMeta(id: string): LocalMeta {
  try {
    const raw = window.localStorage.getItem(LOCAL_META_KEY(id))
    if (raw) return JSON.parse(raw) as LocalMeta
  } catch {
    /* storage unavailable */
  }
  return { category: null, employment_type: null }
}

function writeLocalMeta(id: string, meta: LocalMeta) {
  try {
    window.localStorage.setItem(LOCAL_META_KEY(id), JSON.stringify(meta))
  } catch {
    /* storage unavailable */
  }
}

function section(title: string, items: string[]): string | null {
  const clean = items.map((s) => s.trim()).filter(Boolean)
  if (!clean.length) return null
  return `${title}\n${clean.map((s) => `- ${s}`).join('\n')}`
}

/** overview + arrays → one description with headed sections. */
function descriptionFromLegacy(detail: Pick<JobDetail, 'overview' | 'responsibilities' | 'benefits'>): string {
  return [
    detail.overview?.trim() || null,
    section('Responsibilities', detail.responsibilities ?? []),
    section('Benefits', detail.benefits ?? []),
  ]
    .filter(Boolean)
    .join('\n\n')
}

function jobState(status: LegacyJobStatus): JobState {
  if (status === 'active') return 'open'
  if (status === 'expired') return 'closed'
  return 'draft'
}

function toJob(detail: JobDetail & { slug?: string | null; screening_questions?: string[] }): Job {
  const meta = typeof window === 'undefined' ? null : readLocalMeta(detail.id)
  return {
    id: detail.id,
    slug: detail.slug ?? null,
    company_name: detail.company?.name ?? '',
    title: detail.title,
    location: detail.location,
    work_type: detail.location_type,
    employment_type: meta?.employment_type ?? null,
    category: meta?.category ?? null,
    salary_min: detail.salary_min,
    salary_max: detail.salary_max,
    currency: detail.currency || 'NPR',
    description: descriptionFromLegacy(detail),
    must_haves: (detail.requirements ?? []).slice(0, 6),
    nice_to_haves: (detail.preferred_qualifications ?? []).slice(0, 6),
    questions: (detail.screening_questions ?? []).map((label) => ({
      label,
      type: 'short_text',
      required: true,
    })),
    status: jobState(detail.status),
    closed_reason: detail.hiring_completed ? 'hired' : detail.status === 'expired' ? 'expired' : null,
    closes_at: detail.expires_at,
    applicants: detail.applications_count,
    updated_at: detail.updated_at,
  }
}

function toLegacyJobBody(input: Partial<JobInput>) {
  const body: Record<string, unknown> = {}
  if (input.title !== undefined) body.title = input.title.trim() || 'Untitled job'
  if (input.location !== undefined) body.location = input.location?.trim() || null
  if (input.work_type !== undefined) body.location_type = input.work_type
  if (input.salary_min !== undefined) body.salary_min = input.salary_min
  if (input.salary_max !== undefined) body.salary_max = input.salary_max
  if (input.currency !== undefined) body.currency = input.currency || 'NPR'
  if (input.description !== undefined) {
    body.overview = input.description
    body.responsibilities = []
    body.benefits = []
  }
  if (input.must_haves !== undefined) body.requirements = input.must_haves.filter((s) => s.trim())
  if (input.nice_to_haves !== undefined)
    body.preferred_qualifications = input.nice_to_haves.filter((s) => s.trim())
  if (input.questions !== undefined)
    body.screening_questions = input.questions.map((q) => q.label.trim()).filter(Boolean).slice(0, 3)
  if (input.status !== undefined)
    body.status = input.status === 'open' ? 'active' : input.status === 'closed' ? 'expired' : 'draft'
  if (input.closes_at !== undefined) body.expires_at = input.closes_at
  return body
}

/** One line of facts for a job: "Kathmandu · Hybrid · NPR 145,000 – 215,000 · Closes 30 Oct". */
export function jobFacts(job: Pick<Job, 'location' | 'work_type' | 'salary_min' | 'salary_max' | 'currency'>) {
  return [
    job.location,
    WORK_TYPES.find((w) => w.value === job.work_type)?.label,
    formatSalary(job.salary_min, job.salary_max, job.currency),
  ]
}

function draftFromLegacy(draft: JobAIDraftPayload): JobDraft {
  return {
    title: draft.title || undefined,
    location: draft.location,
    work_type: draft.location_type,
    salary_min: draft.salary_min,
    salary_max: draft.salary_max,
    currency: draft.currency || 'NPR',
    description: descriptionFromLegacy({
      overview: draft.overview,
      responsibilities: draft.responsibilities,
      benefits: draft.benefits,
    }),
    must_haves: draft.requirements.slice(0, 6),
    nice_to_haves: draft.preferred_qualifications.slice(0, 6),
  }
}

// ---------------------------------------------------------------------------
// Must-have suggestions (fallback: lines from a requirements section)
// ---------------------------------------------------------------------------

const REQUIREMENT_HINT =
  /\b(require|must|qualif|need|experience|years?|licen[cs]e|degree|certif|skill|fluent|speak|knowledge|able to|ability|pass|plus\s*2|SLC|SEE|CA\b|nursing|बर्ष|अनुभव|योग्यता)/i

/** 3–6 short criteria from a description. */
export function suggestMustHaves(description: string): string[] {
  const lines = description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const bullets: string[] = []
  let inRequirements = false
  for (const line of lines) {
    const isBullet = /^([-*•·]|\d+[.)])\s+/.test(line)
    const text = line.replace(/^([-*•·]|\d+[.)])\s+/, '').trim()
    if (!isBullet && text.length < 60) {
      inRequirements = /require|qualif|must|looking for|you have|who you are|योग्यता/i.test(text)
      continue
    }
    if (isBullet && inRequirements) bullets.push(text)
  }
  let picks = bullets
  if (picks.length < 3) {
    const sentences = description
      .split(/(?<=[.!?।])\s+|\n+/)
      .map((s) => s.replace(/^([-*•·]|\d+[.)])\s+/, '').trim())
      .filter((s) => s.length > 3 && s.length <= 120 && REQUIREMENT_HINT.test(s))
    picks = [...picks, ...sentences.filter((s) => !picks.includes(s))]
  }
  return [...new Set(picks.map((s) => s.replace(/[.;]$/, '')))]
    .map((s) => (s.length > 80 ? `${s.slice(0, 77).trimEnd()}…` : s))
    .slice(0, 6)
}

// ---------------------------------------------------------------------------
// RTK Query endpoints
// ---------------------------------------------------------------------------

type LegacyAppRow = {
  id: string
  status: ApplicationStatus
  created_at: string
  applicant_name: string
  applicant_email: string | null
  applicant_avatar_url: string | null
  score: number | null
  strengths: string[] | null
  ai_review_status?: string | null
  ai_flag_reason?: string | null
  source?: string | null
  referred_by?: string | null
}

type CandidateDetailLegacy = RecruiterCandidateDetailView & {
  ai_review_status?: string | null
  ai_flag_reason?: string | null
  source?: string | null
  referred_by?: string | null
  screening_answers?: { question: string; answer: string }[]
  has_cv_file?: boolean
}

type CompanyPeople = {
  candidate_id: string
  applications: { application_id: string; job_id: string; job_title: string; status: ApplicationStatus }[]
}[]

const EMPTY_COUNTS: Record<CountedStage, number> = {
  new: 0,
  shortlisted: 0,
  interview: 0,
  offer: 0,
  hired: 0,
  rejected: 0,
}

function toPipelineItem(row: LegacyAppRow): PipelineItem {
  rawStatus.set(row.id, row.status)
  const state = reviewState(row.ai_review_status, row.score)
  const flagged = state === 'needs_person' || !!row.ai_flag_reason
  return {
    application_id: row.id,
    person: { name: row.applicant_name, email: row.applicant_email, avatar_url: row.applicant_avatar_url },
    fit: flagged ? null : fitFromScore(row.score),
    summary: flagged ? null : summaryFrom(row.strengths),
    stage: STATUS_TO_STAGE[row.status],
    source: toSource(row.source),
    applied_at: row.created_at,
    flagged,
    flag_reason: flagged ? row.ai_flag_reason || 'Something in this CV needs a person to check it.' : null,
    review_state: state,
    referred_by: row.referred_by ?? null,
    // The current review has no per-must-have checks.
    checks_met: 0,
    checks_total: 0,
  }
}

// Every application in the company grouped by person, for "Also applied to N other roles".
// Cached briefly so moving through a list doesn't refetch it per candidate.
let peopleCache: { at: number; data: Promise<CompanyPeople> } | null = null

function loadPeople(
  fetchWithBQ: (arg: FetchArgs) => MaybePromise<{ data?: unknown; error?: unknown }>,
): Promise<CompanyPeople> {
  if (peopleCache && Date.now() - peopleCache.at < 30_000) return peopleCache.data
  const data = Promise.resolve(
    fetchWithBQ({ url: `${API}/applications/company/me/candidates`, params: { page: 1, size: 200 } }),
  ).then((r) => (r.error ? [] : ((r.data as ApiResponse<CompanyPeople>).data ?? [])))
  peopleCache = { at: Date.now(), data }
  return data
}

const FIT_RANK: Record<Fit, number> = { strong: 3, possible: 2, weak: 1 }

function period(start: string | null, end: string | null): string | null {
  const year = (d: string | null) => (d ? new Date(d).getFullYear() : null)
  const from = year(start)
  const to = end ? year(end) : 'now'
  if (!from) return null
  return from === to ? String(from) : `${from}–${to}`
}

const EVENT_MAP: Record<string, { type: CandidateEvent['type']; text: string } | null> = {
  application_received: { type: 'applied', text: 'Applied' },
  application_review_updated: { type: 'review_done', text: 'Review done' },
  outreach_email_sent: { type: 'email_sent', text: 'Email sent' },
  outreach_draft_generated: null,
  outreach_draft_approved: null,
  outreach_draft_discarded: null,
  candidate_shortlisted: { type: 'stage_changed', text: 'Shortlisted' },
  candidate_rejected: { type: 'stage_changed', text: 'Rejected' },
  candidate_interview_booked: { type: 'stage_changed', text: 'Moved to interview' },
  interview_booked: { type: 'interview_booked', text: 'Interview booked' },
  candidate_interview_completed: { type: 'interview_done', text: 'Interview done' },
  candidate_offer: { type: 'stage_changed', text: 'Offer made' },
  candidate_offer_accepted: { type: 'stage_changed', text: 'Accepted the offer' },
  candidate_offer_declined: { type: 'stage_changed', text: 'Declined the offer' },
}


export const recruiterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPipeline: builder.query<Pipeline, { jobId: string; stage: CountedStage; sort: PipelineSort }>({
      async queryFn({ jobId, stage, sort }, _api, _extra, fetchWithBQ) {
        const rows: LegacyAppRow[] = []
        for (let page = 1; page <= 20; page += 1) {
          const result = await fetchWithBQ({
            url: `${API}/applications/job/${jobId}`,
            params: { page, size: 100 },
          })
          if (result.error) return { error: result.error }
          const data = (result.data as ApiResponse<LegacyAppRow[]>).data ?? []
          rows.push(...data)
          if (data.length < 100) break
        }
        const all = rows.map(toPipelineItem).map(overlay)
        const counts = { ...EMPTY_COUNTS }
        for (const item of all) if (item.stage !== 'withdrawn') counts[item.stage] += 1
        const items = all
          .filter((item) => item.stage === stage)
          .sort((a, b) => {
            if (sort === 'best_fit') {
              const fa = a.fit ? FIT_RANK[a.fit] : 0
              const fb = b.fit ? FIT_RANK[b.fit] : 0
              if (fa !== fb) return fb - fa
              const sa = rows.find((r) => r.id === a.application_id)?.score ?? -1
              const sb = rows.find((r) => r.id === b.application_id)?.score ?? -1
              if (sa !== sb) return sb - sa
            }
            return b.applied_at.localeCompare(a.applied_at)
          })
        return { data: { counts, items } }
      },
      providesTags: (_r, _e, { jobId }) => [
        'Applications',
        { type: 'Applications', id: `pipeline-${jobId}` },
      ],
    }),

    getCandidate: builder.query<Candidate, string>({
      async queryFn(applicationId, api, _extra, fetchWithBQ) {
        const [detailResult, peopleResult] = await Promise.all([
          fetchWithBQ(`${API}/applications/company/me/candidates/${applicationId}`),
          loadPeople(fetchWithBQ),
        ])
        if (detailResult.error) return { error: detailResult.error }
        const d = (detailResult.data as ApiResponse<CandidateDetailLegacy>).data
        rawStatus.set(d.id, d.status)

        let cvUrl: string | null = null
        if (d.has_cv_file) {
          const cv = await fetchWithBQ(`${API}/applications/company/me/candidates/${applicationId}/cv`)
          cvUrl = cv.error ? null : ((cv.data as ApiResponse<{ url: string }>).data?.url ?? null)
        }

        const state = reviewState(d.ai_review_status, d.score)
        const flagged = state === 'needs_person' || !!d.ai_flag_reason
        const source = toSource(d.source)
        const me = (api.getState() as { auth: { user: { id: string } | null } }).auth.user?.id
        const person = peopleResult.find((p) => p.candidate_id === d.candidate_id)
        const resume = d.resume
        const outline: CvOutline | null =
          resume && (resume.experiences.length || resume.educations.length || resume.skills.length)
            ? {
                headline: d.candidate_headline ?? resume.headline,
                summary: d.candidate_summary ?? resume.summary,
                experiences: resume.experiences.map((e) => ({
                  title: e.title,
                  company: e.company_name,
                  period: period(e.start_date, e.end_date),
                })),
                educations: resume.educations.map((e) => ({
                  title: [e.degree, e.field_of_study, e.institution].filter(Boolean).join(', '),
                  period: period(e.start_date, e.end_date),
                })),
                skills: resume.skills.map((s) => s.skill_name),
              }
            : null

        const events: CandidateEvent[] = []
        for (const event of d.timeline ?? []) {
          const mapped = EVENT_MAP[event.event_type]
          if (mapped === null) continue
          const actor = event.actor_user_id && event.actor_user_id === me ? 'You' : null
          events.push({
            type: mapped?.type ?? 'stage_changed',
            actor,
            text:
              mapped?.type === 'applied'
                ? `Applied · ${SOURCE_LABEL[source]}`
                : (mapped?.text ?? event.title),
            created_at: event.created_at,
          })
        }
        events.sort((a, b) => b.created_at.localeCompare(a.created_at))

        const candidate: Candidate = {
          application_id: d.id,
          job_id: d.job_id,
          job_title: d.job_title,
          person: {
            name: d.applicant_name,
            email: d.applicant_email,
            avatar_url: d.applicant_avatar_url,
            phone: d.candidate_phone,
            location: d.candidate_location,
            linkedin_url: d.linkedin_url,
          },
          stage: STATUS_TO_STAGE[d.status],
          source,
          referred_by: d.referred_by ?? null,
          applied_at: d.created_at,
          review: {
            state,
            fit: flagged ? null : fitFromScore(d.score),
            summary: flagged ? null : summaryFrom(d.strengths),
            checks: flagged
              ? []
              : [
                  // strengths[0] is the summary; the rest read as met checks.
                  ...(d.strengths ?? []).slice(1).map((s) => ({
                    criterion: s,
                    result: 'met' as const,
                    evidence: null,
                  })),
                  ...(d.weaknesses ?? []).map((w) => ({
                    criterion: w,
                    result: 'missing' as const,
                    evidence: null,
                  })),
                ],
            flag_reason: flagged
              ? d.ai_flag_reason || 'Something in this CV needs a person to check it.'
              : null,
          },
          answers: (d.screening_answers ?? []).filter((a) => a?.question),
          cv_url: cvUrl,
          cv_outline: outline,
          other_applications: (person?.applications ?? [])
            .filter((a) => a.application_id !== d.id)
            .map((a) => ({
              application_id: a.application_id,
              job_id: a.job_id,
              job_title: a.job_title,
              stage: STATUS_TO_STAGE[a.status],
            })),
          events,
        }
        return { data: overlay(candidate) }
      },
      providesTags: (_r, _e, id) => [{ type: 'Candidates', id }],
    }),

    /** Queue a decision. The email waits UNDO_WINDOW_MS; `undo(event_id)` cancels it. */
    decide: builder.mutation<
      { event_ids: string[] },
      { application_ids: string[]; action: DecisionAction; jobId?: string }
    >({
      queryFn({ application_ids, action }) {
        const stage = NEXT_STAGE[action]
        const event_ids = application_ids.map((applicationId) => {
          eventSeq += 1
          const eventId = `local-${Date.now()}-${eventSeq}`
          pending.set(eventId, {
            eventId,
            applicationId,
            action,
            stage,
            timer: setTimeout(() => void commit(eventId), UNDO_WINDOW_MS),
          })
          return eventId
        })
        return { data: { event_ids } }
      },
      async onQueryStarted({ application_ids, action }, { dispatch, getState, queryFulfilled }) {
        const stage = NEXT_STAGE[action]
        const ids = new Set(application_ids)
        for (const args of recruiterApi.util.selectCachedArgsForQuery(getState(), 'getPipeline')) {
          dispatch(
            recruiterApi.util.updateQueryData('getPipeline', args, (draft) => {
              const moving = draft.items.filter((i) => ids.has(i.application_id))
              for (const item of moving) {
                if (item.stage !== 'withdrawn') draft.counts[item.stage] -= 1
                if (stage !== 'withdrawn') draft.counts[stage] += 1
              }
              if (stage !== args.stage) draft.items = draft.items.filter((i) => !ids.has(i.application_id))
            }),
          )
        }
        for (const id of application_ids) {
          dispatch(
            recruiterApi.util.updateQueryData('getCandidate', id, (draft) => {
              draft.stage = stage
            }),
          )
        }
        await queryFulfilled.catch(() => undefined)
      },
      invalidatesTags: (_r, _e, { jobId }) =>
        jobId ? [{ type: 'Applications', id: `pipeline-${jobId}` }] : [],
    }),

    undo: builder.mutation<null, string>({
      queryFn(eventId) {
        const entry = pending.get(eventId)
        if (entry) {
          clearTimeout(entry.timer)
          pending.delete(eventId)
        }
        return { data: null }
      },
      invalidatesTags: ['Applications', 'Candidates'],
    }),

    addNote: builder.mutation<null, { applicationId: string; text: string }>({
      queryFn() {
        return { error: { status: 501, data: 'Notes are not available yet.' } }
      },
    }),

    getJob: builder.query<Job, string>({
      query: (id) => `${API}/jobs/${id}`,
      transformResponse: (response: ApiResponse<JobDetail>) => toJob(response.data),
      providesTags: (_r, _e, id) => [{ type: 'Jobs', id }],
    }),

    /** Create (no id) or update a job. Returns the saved job. */
    saveJob: builder.mutation<Job, Partial<JobInput>>({
      async queryFn(input, _api, _extra, fetchWithBQ) {
        const body = toLegacyJobBody(input)
        if (!input.id && !body.title) body.title = 'Untitled job'
        const result = await fetchWithBQ({
          url: input.id ? `${API}/jobs/${input.id}` : `${API}/jobs/`,
          method: input.id ? 'PATCH' : 'POST',
          body,
        })
        if (result.error) return { error: result.error }
        const saved = toJob((result.data as ApiResponse<JobDetail>).data)
        if (input.category !== undefined || input.employment_type !== undefined) {
          const previous = readLocalMeta(saved.id)
          writeLocalMeta(saved.id, {
            category: input.category !== undefined ? input.category : previous.category,
            employment_type:
              input.employment_type !== undefined ? input.employment_type : previous.employment_type,
          })
        }
        return { data: { ...saved, ...readLocalMeta(saved.id) } }
      },
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(recruiterApi.util.upsertQueryData('getJob', data.id, data))
        } catch {
          /* surfaced by the caller */
        }
      },
      invalidatesTags: ['Jobs'],
    }),

    closeJob: builder.mutation<null, { id: string; reason: 'cancelled' | 'hired' }>({
      query: ({ id, reason }) =>
        reason === 'hired'
          ? { url: `${API}/jobs/${id}/complete-hiring`, method: 'POST' }
          : { url: `${API}/jobs/${id}`, method: 'PATCH', body: { status: 'expired' } },
      transformResponse: () => null,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Jobs', id }, 'Jobs', 'Applications', 'Candidates'],
    }),

    reopenJob: builder.mutation<null, { id: string; closes_at: string }>({
      query: ({ id, closes_at }) => ({
        url: `${API}/jobs/${id}`,
        method: 'PATCH',
        body: { status: 'active', expires_at: closes_at },
      }),
      transformResponse: () => null,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Jobs', id }, 'Jobs'],
    }),

    deleteJob: builder.mutation<null, string>({
      query: (id) => ({ url: `${API}/jobs/${id}`, method: 'DELETE' }),
      transformResponse: () => null,
      invalidatesTags: ['Jobs'],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
})

export const {
  useGetPipelineQuery,
  useGetCandidateQuery,
  useDecideMutation,
  useUndoMutation,
  useAddNoteMutation,
  useGetJobQuery,
  useSaveJobMutation,
  useCloseJobMutation,
  useReopenJobMutation,
  useDeleteJobMutation,
} = recruiterApi

/** Plain-function form of decide/undo for non-hook callers. */
export const decide = (args: { application_ids: string[]; action: DecisionAction }) =>
  store.dispatch(recruiterApi.endpoints.decide.initiate(args)).unwrap()
export const undo = (eventId: string) =>
  store.dispatch(recruiterApi.endpoints.undo.initiate(eventId)).unwrap()

// ---------------------------------------------------------------------------
// Assistant (SSE): events `token` {text}, `final` {draft} | {answer, quotes, suggested_action?}
// ---------------------------------------------------------------------------

type StreamHandlers = { onToken?: (text: string) => void; signal?: AbortSignal }

async function streamSse<T>(url: string, body: unknown, { onToken, signal }: StreamHandlers): Promise<T> {
  const response = await authedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok || !response.body) throw new Error(`Request failed (${response.status})`)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let final: T | null = null
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      const raw = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      let event = 'message'
      const data: string[] = []
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data.push(line.slice(5).trim())
      }
      if (data.length) {
        const parsed = JSON.parse(data.join('\n')) as Record<string, unknown>
        if (event === 'token' && typeof parsed.text === 'string') onToken?.(parsed.text)
        else if (event === 'final') final = parsed as T
        else if (event === 'error') throw new Error(String(parsed.message ?? 'Stream failed'))
      }
      boundary = buffer.indexOf('\n\n')
    }
    if (done) break
  }
  if (!final) throw new Error('The answer was cut off.')
  return final
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

/**
 * Turn a few words or a pasted description into job fields.
 * Fallback: the current job_ai draft endpoint (create → poll → delete the temporary draft).
 */
export async function streamJobDraft(
  { message, draft_id }: { message: string; draft_id?: string | null },
  handlers: StreamHandlers = {},
): Promise<{ draft: JobDraft }> {
  if (CAPABILITIES.assistant) {
    return streamSse<{ draft: JobDraft }>(`${API}/assistant/job-draft`, { message, draft_id }, handlers)
  }
  const created = await store
    .dispatch(jobAiApi.endpoints.createJobAIDraft.initiate({ rough_description: message, mode: 'create' }))
    .unwrap()
  const id = created.data.id
  try {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const record = await store
        .dispatch(jobAiApi.endpoints.getJobAIDraft.initiate(id, { forceRefetch: true, subscribe: false }))
        .unwrap()
      const data = record.data
      if (data.status === 'failed') throw new Error('Drafting failed')
      if (data.latest_draft && data.status !== 'drafting') return { draft: draftFromLegacy(data.latest_draft) }
      await sleep(1500, handlers.signal)
    }
    throw new Error('Drafting took too long')
  } finally {
    void store.dispatch(jobAiApi.endpoints.deleteJobAIDraft.initiate(id))
  }
}

/** Fields from a legacy AI draft (Jobs list "Continue" links: /recruiter/jobs/new?draftId=…). */
export async function loadLegacyDraft(draftId: string): Promise<JobDraft | null> {
  try {
    const record = await store
      .dispatch(jobAiApi.endpoints.getJobAIDraft.initiate(draftId, { subscribe: false }))
      .unwrap()
    return record.data.latest_draft ? draftFromLegacy(record.data.latest_draft) : null
  } catch {
    return null
  }
}

export function discardLegacyDraft(draftId: string) {
  void store.dispatch(jobAiApi.endpoints.deleteJobAIDraft.initiate(draftId))
}

export async function streamCandidateQuestion(
  applicationId: string,
  { message }: { message: string },
  handlers: StreamHandlers = {},
): Promise<CandidateAnswer> {
  if (!CAPABILITIES.assistant) throw new Error('Coming soon')
  return streamSse<CandidateAnswer>(
    `${API}/assistant/applications/${applicationId}/ask`,
    { message },
    handlers,
  )
}

// ---------------------------------------------------------------------------
// Sector templates (GET /job-templates?category=, local list until it exists)
// ---------------------------------------------------------------------------

export type JobTemplate = {
  id: string
  title: string
  category: JobCategory
  must_haves: string[]
  questions: JobQuestion[]
}

const q = (label: string, type: JobQuestion['type'] = 'short_text'): JobQuestion => ({
  label,
  type,
  required: true,
})

const LOCAL_TEMPLATES: JobTemplate[] = [
  {
    id: 'staff-nurse',
    title: 'Staff nurse',
    category: 'healthcare',
    must_haves: [
      'Registered with Nepal Nursing Council',
      'PCL or B.Sc. Nursing',
      '1+ year of ward experience',
      'Can work night shifts',
    ],
    questions: [q('Is your Nursing Council registration valid?', 'yes_no'), q('Where did you work last?')],
  },
  {
    id: 'accountant',
    title: 'Accountant',
    category: 'banking_finance',
    must_haves: [
      'CA Inter, BBS or MBS',
      '2+ years of bookkeeping',
      'Uses Tally or similar software',
      'Files VAT and TDS',
    ],
    questions: [q('Which accounting software have you used?'), q('Expected monthly salary (NPR)?')],
  },
  {
    id: 'bank-teller',
    title: 'Bank teller',
    category: 'banking_finance',
    must_haves: ["Bachelor's degree", 'Handles cash accurately', 'Speaks Nepali and English'],
    questions: [q('Have you handled cash at work before?', 'yes_no')],
  },
  {
    id: 'teacher',
    title: 'School teacher',
    category: 'education',
    must_haves: [
      "Bachelor's in education or the subject",
      'Teaching licence',
      '1+ year of classroom teaching',
    ],
    questions: [q('Which subjects and grades can you teach?')],
  },
  {
    id: 'hotel-receptionist',
    title: 'Hotel receptionist',
    category: 'hospitality_tourism',
    must_haves: ['Speaks English with guests', 'Front desk or guest service experience', 'Basic computer use', 'Can work shifts'],
    questions: [q('Which languages do you speak?')],
  },
  {
    id: 'cook',
    title: 'Cook',
    category: 'hospitality_tourism',
    must_haves: ['2+ years in a hotel or restaurant kitchen', 'Cooks Nepali and continental dishes', 'Keeps the kitchen clean and safe'],
    questions: [q('Which dishes or cuisines can you cook?')],
  },
  {
    id: 'sales-representative',
    title: 'Sales representative',
    category: 'sales_retail',
    must_haves: ['1+ year in sales', 'Two-wheeler licence', 'Comfortable with monthly targets'],
    questions: [q('Do you have a two-wheeler licence?', 'yes_no')],
  },
  {
    id: 'driver',
    title: 'Driver',
    category: 'logistics_driving',
    must_haves: ['Valid driving licence for the vehicle', '3+ years of driving', 'Clean driving record'],
    questions: [q('Which licence category do you hold?')],
  },
  {
    id: 'security-guard',
    title: 'Security guard',
    category: 'other',
    must_haves: ['Security training or service background', 'Can work night shifts', 'Physically able to patrol'],
    questions: [q('Can you work night shifts?', 'yes_no')],
  },
  {
    id: 'machine-operator',
    title: 'Machine operator',
    category: 'manufacturing',
    must_haves: ['Has operated factory machines', 'Follows safety rules', 'Can work shifts'],
    questions: [q('Which machines have you operated?')],
  },
  {
    id: 'office-assistant',
    title: 'Office assistant',
    category: 'office_admin',
    must_haves: ['+2 or higher', 'Uses Word and Excel', 'Keeps files and records in order'],
    questions: [q('When can you start?')],
  },
  {
    id: 'field-officer',
    title: 'NGO field officer',
    category: 'ngo_ingo',
    must_haves: ["Bachelor's degree", '1+ year of community or field work', 'Can travel to districts', 'Writes short reports'],
    questions: [q('Which districts have you worked in?')],
  },
  {
    id: 'software-developer',
    title: 'Software developer',
    category: 'it_software',
    must_haves: ['2+ years building software in production', 'Uses Git', 'Writes clear code others can read'],
    questions: [q('Link to your work (GitHub, portfolio or app)')],
  },
]

let templatesEndpoint: 'unknown' | 'yes' | 'no' = 'unknown'

/** Sector templates for the builder. Uses B1's endpoint when it's there. */
export async function getJobTemplates(category?: JobCategory | null): Promise<JobTemplate[]> {
  const local = () => LOCAL_TEMPLATES.filter((t) => !category || t.category === category)
  if (templatesEndpoint === 'no') return local()
  try {
    const url = `${API}/job-templates${category ? `?category=${category}` : ''}`
    const response = await authedFetch(url)
    if (!response.ok) {
      if (response.status === 404) templatesEndpoint = 'no'
      return local()
    }
    templatesEndpoint = 'yes'
    const body = (await response.json()) as ApiResponse<JobTemplate[]>
    return body.data?.length ? body.data : local()
  } catch {
    return local()
  }
}

// ---------------------------------------------------------------------------
// Protected grounds (Labour Act 2074 §6, Constitution Art. 18): flag criteria
// that may screen people out for who they are rather than what they can do.
// ---------------------------------------------------------------------------

const PROTECTED =
  /\b(male|female|man|woman|men|women|girls?|boys?|gender|sex|age[ds]?\s*\d|\d+\s*(-|to|–)\s*\d+\s*(years|yrs)\s*(old|of age)|under\s*\d+|below\s*\d+\s*years|above\s*\d+\s*years|years old|unmarried|married|single|marital|religio\w*|hindu|muslim|christian|buddhist|caste|brahmin|chhetri|newar|janajati|dalit|ethnic\w*|pregnan\w*|good[- ]looking|attractive|fair (skin|complexion)|height|disab\w*|hiv|political|party member)\b|पुरुष|महिला|केटी|केटा|उमेर|अविवाहित|विवाहित|जात|धर्म/i

export const PROTECTED_WARNING = 'This may be discrimination under the Labour Act — remove or reword'

export function protectedGroundWarning(criterion: string): string | null {
  return PROTECTED.test(criterion) ? PROTECTED_WARNING : null
}

// ---------------------------------------------------------------------------
// Export and quick-add
// ---------------------------------------------------------------------------

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Download every applicant for a job as a CSV file (opens in Excel). */
export async function exportPipelineCsv(jobId: string, jobTitle: string): Promise<void> {
  const rows: LegacyAppRow[] = []
  for (let page = 1; page <= 20; page += 1) {
    const response = await authedFetch(`${API}/applications/job/${jobId}?page=${page}&size=100`)
    if (!response.ok) throw new Error(String(response.status))
    const data = ((await response.json()) as ApiResponse<LegacyAppRow[]>).data ?? []
    rows.push(...data)
    if (data.length < 100) break
  }
  const header = ['Name', 'Email', 'Stage', 'Fit', 'Summary', 'Source', 'Applied', 'Flag']
  const lines = rows.map(toPipelineItem).map(overlay).map((item) =>
    [
      item.person.name,
      item.person.email,
      STAGE_LABEL[item.stage],
      item.fit ? FIT_LABEL[item.fit] : '',
      item.summary,
      SOURCE_LABEL[item.source],
      item.applied_at.slice(0, 10),
      item.flag_reason,
    ]
      .map(csvCell)
      .join(','),
  )
  const blob = new Blob([`﻿${[header.join(','), ...lines].join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${jobTitle.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}-applicants.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export type QuickAddInput = {
  jobId: string
  name: string
  phone: string
  cv: File | null
  source: 'walk_in' | 'phone' | 'referral'
  referred_by: string | null
}

/** Add a walk-in / phone / referral candidate. Not available on the current backend. */
export async function addCandidate(input: QuickAddInput): Promise<{ application_id: string }> {
  if (!CAPABILITIES.addCandidate) throw new Error('Coming soon')
  const form = new FormData()
  form.set('full_name', input.name)
  form.set('phone', input.phone)
  form.set('source', input.source)
  if (input.referred_by) form.set('referred_by', input.referred_by)
  if (input.cv) form.set('cv', input.cv)
  const response = await authedFetch(`${API}/jobs/${input.jobId}/candidates`, { method: 'POST', body: form })
  if (!response.ok) throw new Error(String(response.status))
  store.dispatch(baseApi.util.invalidateTags(['Applications', 'Candidates']))
  return ((await response.json()) as ApiResponse<{ application_id: string }>).data
}

// ---------------------------------------------------------------------------
// Referrers: "Ask people you know". Each contact gets a personal link.
// B1 API: POST /jobs/{id}/referrers {name, phone} → {token}. Until it exists the
// token is made here and the link still tags the application as a referral.
// ---------------------------------------------------------------------------

export type Referrer = { name: string; phone: string | null; token: string; link: string }

function origin() {
  return typeof window === 'undefined' ? '' : window.location.origin
}

export async function createReferrer(
  job: { id: string; slug: string },
  contact: { name: string; phone: string | null },
): Promise<Referrer> {
  const make = (token: string) => ({
    ...contact,
    token,
    link: `${origin()}/jobs/${encodeURIComponent(job.slug)}?src=referral&ref=${encodeURIComponent(token)}`,
  })
  try {
    const response = await authedFetch(`${API}/jobs/${job.id}/referrers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    })
    if (response.ok) {
      const body = (await response.json()) as ApiResponse<{ token: string }>
      if (body.data?.token) return make(body.data.token)
    }
  } catch {
    /* fall through */
  }
  const slug =
    contact.name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '') || 'friend'
  return make(`${slug}-${Math.random().toString(36).slice(2, 6)}`)
}

/** Ready-to-send message for a contact, Nepali first then English. */
export function referralMessage(
  job: { title: string; company_name: string },
  contact: { name: string },
  link: string,
): string {
  const first = contact.name.trim().split(/\s+/)[0] || ''
  return [
    `नमस्ते ${first}, हामी ${job.company_name} मा "${job.title}" को लागि मान्छे खोज्दैछौं। तपाईंले चिनेको कोही राम्रो मान्छे छ भने यो लिंक पठाइदिनुहोस्:`,
    link,
    '',
    `Hi ${first}, we're hiring a ${job.title} at ${job.company_name}. If you know someone good, please send them this link:`,
    link,
  ].join('\n')
}

export function posterUrl(slug: string) {
  return `/jobs/${encodeURIComponent(slug)}/poster`
}

/** "+977-9818-445566" → "9779818445566" for tel/Viber/WhatsApp links. */
export function phoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('9')) return `977${digits}`
  return digits
}

export const contactLinks = {
  call: (phone: string) => `tel:+${phoneDigits(phone)}`,
  viber: (phone: string) => `viber://chat?number=%2B${phoneDigits(phone)}`,
  whatsapp: (phone: string) => `https://wa.me/${phoneDigits(phone)}`,
  viberText: (text: string) => `viber://forward?text=${encodeURIComponent(text)}`,
  whatsappText: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`,
  smsText: (text: string) => `sms:?&body=${encodeURIComponent(text)}`,
}
