/**
 * The job page, applicant panel and decisions: /recruiter/v2/*.
 * Types mirror backend/app/modules/applications/schemas.py exactly.
 */
import { JOB_CATEGORIES } from '@/lib/jobHelpers'
import { store } from '@/store'
import { type ApiResponse, baseApi, refreshSession } from '@/store/services/baseApi'
import type {
  EmploymentType,
  JobCategory,
  JobFields,
  JobQuestion,
  JobStatus,
  LocationType,
} from '@/store/services/jobsApi'
import { updateAccessToken } from '@/store/slices/authSlice'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export type Stage =
  | 'new'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
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

export type StageCounts = Record<Stage, number>

export interface ReferrerRef {
  id: string
  name: string
}

export interface PipelineJob {
  id: string
  title: string
  slug: string
  status: JobStatus
  closed_reason: string | null
  closes_at: string | null
  category: JobCategory
  employment_type: EmploymentType
  location: string | null
  location_type: LocationType
  salary_min: number | null
  salary_max: number | null
  currency: string
}

export interface PipelineItem {
  application_id: string
  person_id: string
  name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  /** One line from the review; null while reviewing or flagged. */
  summary: string | null
  /** null while reviewing, flagged, or the job has no criteria. */
  fit: Fit | null
  review_state: ReviewState
  flagged: boolean
  stage: Stage
  source: Source
  referred_by: ReferrerRef | null
  applied_at: string
  updated_at: string
}

export interface JobPipeline {
  job: PipelineJob
  counts: StageCounts
  reviewing: number
  reviewed: number
  items: PipelineItem[]
}

export interface PersonContact {
  id: string
  name: string
  email: string | null
  phone: string | null
  location: string | null
  avatar_url: string | null
  headline: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
}

export type CheckResult = 'met' | 'partly' | 'missing'

export interface ReviewCheck {
  criterion: string
  kind: 'must' | 'nice' | 'knockout'
  result: CheckResult
  /** Exact words from the CV or answers; null when missing. */
  evidence: string | null
}

export interface ReviewView {
  state: ReviewState
  fit: Fit | null
  summary: string | null
  checks: ReviewCheck[]
  flagged: boolean
  flag_reason: string | null
}

export type EventType =
  | 'applied'
  | 'stage_changed'
  | 'email_scheduled'
  | 'email_sent'
  | 'interview_booked'
  | 'interview_done'
  | 'note'
  | 'review_done'
  | 'flag_cleared'

export interface EventView {
  id: string
  type: EventType
  actor: { id: string; name: string } | null
  payload: Record<string, unknown>
  created_at: string
}

export interface ResumeResponse {
  id: string
  user_id: string
  resume_name: string
  headline: string | null
  summary: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  years_of_experience: number | null
  experiences: {
    id: string
    company_name: string
    title: string
    start_date: string | null
    end_date: string | null
    description: string[]
  }[]
  educations: {
    id: string
    institution: string
    degree: string | null
    field_of_study: string | null
    start_date: string | null
    end_date: string | null
  }[]
  skills: { id: string; skill_name: string }[]
  created_at: string
  updated_at: string
}

export type DecideAction =
  | 'shortlist'
  | 'reject'
  | 'invite_to_interview'
  | 'make_offer'
  | 'mark_hired'
  | 'move_back'
  | 'withdraw'

export interface CandidatePanel {
  application_id: string
  job: { id: string; title: string }
  stage: Stage
  source: Source
  referred_by: ReferrerRef | null
  applied_at: string
  decided_at: string | null
  rejected_reason: string | null
  person: PersonContact
  review: ReviewView
  answers: { question: string; answer: string }[]
  /** Short-lived link to the CV PDF; null when no file was sent. */
  cv_url: string | null
  resume: ResumeResponse | null
  /** Other applications by this person to this business's jobs. */
  other_applications: number
  events: EventView[]
  /** Decide actions valid for the current stage, in button order. */
  actions: DecideAction[]
}

export interface DecideResult {
  application_id: string
  ok: boolean
  stage: Stage | null
  event_id: string | null
  email_scheduled: boolean
  error: string | null
}

export interface DecideResponse {
  results: DecideResult[]
  undo_event_ids: string[]
  /** Emails go out this many seconds after the decision unless undone. */
  undo_seconds: number
}

export interface UndoResponse {
  undone: string[]
  failed: { event_id: string; reason: string }[]
}

export interface ReferrerResponse {
  id: string
  name: string
  phone: string | null
  token: string
  /** Public link to share: {frontend}/jobs/{slug}?ref={token} */
  link: string
  applications: number
  created_at: string
}

/** GET /applications/company/me/candidates: one row per person across jobs. */
export interface CompanyPerson {
  candidate_id: string
  applicant_name: string
  applicant_email: string | null
  applicant_phone: string | null
  applicant_avatar_url: string | null
  latest_application_id: string
  latest_stage: Stage
  latest_fit: Fit | null
  latest_applied_at: string
  last_activity_at: string
  primary_job_title: string
  primary_job_id: string
  application_count: number
  applications: {
    application_id: string
    job_id: string
    job_title: string
    stage: Stage
    fit: Fit | null
    summary: string | null
    flagged: boolean
    source: string | null
    created_at: string
    updated_at: string
  }[]
}

export interface PeopleSearchResponse {
  query: string
  total: number
  candidates: {
    application_id: string
    candidate_id: string
    applicant_name: string
    applicant_email: string | null
    applicant_avatar_url: string | null
    job_title: string
    job_id: string
    stage: Stage
    fit: Fit | null
    summary: string | null
    match_score: number
    applied_at: string
    updated_at: string
  }[]
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Not selected',
  withdrawn: 'Withdrawn',
}

export const FIT_LABEL: Record<Fit, string> = {
  strong: 'Fits',
  possible: 'Might fit',
  weak: "Doesn't fit yet",
}

export const ACTION_LABEL: Record<DecideAction, string> = {
  shortlist: 'Shortlist',
  reject: 'Reject',
  invite_to_interview: 'Invite to interview',
  make_offer: 'Make offer',
  mark_hired: 'Mark hired',
  move_back: 'Move back a step',
  withdraw: 'Mark withdrawn',
}

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

/** Where each action moves someone (move_back depends on history). */
const TARGET: Partial<Record<DecideAction, Stage>> = {
  shortlist: 'shortlisted',
  reject: 'rejected',
  invite_to_interview: 'interview',
  make_offer: 'offer',
  mark_hired: 'hired',
  withdraw: 'withdrawn',
}

/** The forward action for a stage: shown as the main button on list cards. */
export const FORWARD: Partial<Record<Stage, DecideAction>> = {
  new: 'shortlist',
  shortlisted: 'invite_to_interview',
  interview: 'make_offer',
  offer: 'mark_hired',
}

/** Stages Reject applies to (backend ACTIVE_STAGES). */
export const CAN_REJECT = (stage: Stage) =>
  stage === 'new' || stage === 'shortlisted' || stage === 'interview' || stage === 'offer'

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const pipelineTag = (jobId: string) => ({ type: 'Applications' as const, id: `pipeline-${jobId}` })

export const recruiterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPipeline: builder.query<JobPipeline, { jobId: string; stage: Stage; sort: PipelineSort }>({
      query: ({ jobId, stage, sort }) => ({
        url: `${API}/recruiter/v2/jobs/${jobId}/pipeline`,
        params: { stage, sort },
      }),
      transformResponse: (res: ApiResponse<JobPipeline>) => res.data,
      providesTags: (_r, _e, { jobId }) => ['Applications', pipelineTag(jobId)],
    }),

    getCandidate: builder.query<CandidatePanel, string>({
      query: (id) => `${API}/recruiter/v2/applications/${id}`,
      transformResponse: (res: ApiResponse<CandidatePanel>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Candidates', id }],
    }),

    /** One decision for one or many people. The server holds the email for `undo_seconds`. */
    decide: builder.mutation<
      DecideResponse,
      { action: DecideAction; application_ids: string[]; jobId?: string }
    >({
      query: ({ action, application_ids }) => ({
        url: `${API}/recruiter/v2/decide`,
        method: 'POST',
        body: { action, application_ids },
      }),
      transformResponse: (res: ApiResponse<DecideResponse>) => res.data,
      async onQueryStarted({ action, application_ids }, { dispatch, getState, queryFulfilled }) {
        const target = TARGET[action]
        if (!target) return
        const ids = new Set(application_ids)
        const patches = recruiterApi.util
          .selectCachedArgsForQuery(getState(), 'getPipeline')
          .map((args) =>
            dispatch(
              recruiterApi.util.updateQueryData('getPipeline', args, (draft) => {
                if (args.stage === target) return
                const moving = draft.items.filter((i) => ids.has(i.application_id))
                for (const item of moving) {
                  draft.counts[item.stage] -= 1
                  draft.counts[target] += 1
                }
                draft.items = draft.items.filter((i) => !ids.has(i.application_id))
              }),
            ),
          )
        for (const id of application_ids)
          patches.push(
            dispatch(
              recruiterApi.util.updateQueryData('getCandidate', id, (draft) => {
                draft.stage = target
                draft.actions = []
              }),
            ),
          )
        try {
          const { data } = await queryFulfilled
          if (data.results.some((r) => !r.ok)) throw new Error('partly failed')
        } catch {
          for (const patch of patches) patch.undo()
        }
      },
      invalidatesTags: (_r, _e, { application_ids, jobId }) => [
        ...(jobId ? [pipelineTag(jobId)] : ['Applications' as const]),
        ...application_ids.map((id) => ({ type: 'Candidates' as const, id })),
        'Jobs',
      ],
    }),

    /** Undo decisions whose email has not gone out yet. */
    undo: builder.mutation<UndoResponse, string[]>({
      query: (event_ids) => ({
        url: `${API}/recruiter/v2/undo`,
        method: 'POST',
        body: { event_ids },
      }),
      transformResponse: (res: ApiResponse<UndoResponse>) => res.data,
      invalidatesTags: ['Applications', 'Candidates', 'Jobs'],
    }),

    addNote: builder.mutation<EventView, { applicationId: string; text: string }>({
      query: ({ applicationId, text }) => ({
        url: `${API}/recruiter/v2/applications/${applicationId}/notes`,
        method: 'POST',
        body: { text },
      }),
      transformResponse: (res: ApiResponse<EventView>) => res.data,
      async onQueryStarted({ applicationId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            recruiterApi.util.updateQueryData('getCandidate', applicationId, (draft) => {
              draft.events.push(data)
            }),
          )
        } catch {
          /* surfaced by the caller */
        }
      },
    }),

    /** "I checked the CV": clears the flag and starts the review. */
    clearFlag: builder.mutation<CandidatePanel, string>({
      query: (applicationId) => ({
        url: `${API}/recruiter/v2/applications/${applicationId}/clear-flag`,
        method: 'POST',
      }),
      transformResponse: (res: ApiResponse<CandidatePanel>) => res.data,
      async onQueryStarted(applicationId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(recruiterApi.util.upsertQueryData('getCandidate', applicationId, data))
        } catch {
          /* surfaced by the caller */
        }
      },
      invalidatesTags: ['Applications'],
    }),

    /** Walk-in, phone or referral applicant. */
    quickAdd: builder.mutation<
      { application_id: string; person_id: string },
      {
        jobId: string
        full_name: string
        phone: string
        source: 'walk_in' | 'phone' | 'referral'
        referred_by: string | null
        cv: File | null
      }
    >({
      query: ({ jobId, full_name, phone, source, referred_by, cv }) => {
        const form = new FormData()
        form.set('full_name', full_name)
        form.set('phone', phone)
        form.set('source', source)
        if (referred_by) form.set('referred_by', referred_by)
        if (cv) form.set('cv', cv)
        return { url: `${API}/recruiter/v2/jobs/${jobId}/candidates`, method: 'POST', body: form }
      },
      transformResponse: (res: ApiResponse<{ application_id: string; person_id: string }>) =>
        res.data,
      invalidatesTags: (_r, _e, { jobId }) => [pipelineTag(jobId), 'Jobs', 'Candidates'],
    }),

    listReferrers: builder.query<ReferrerResponse[], string>({
      query: (jobId) => `${API}/recruiter/v2/jobs/${jobId}/referrers`,
      transformResponse: (res: ApiResponse<ReferrerResponse[]>) => res.data,
      providesTags: (_r, _e, jobId) => [{ type: 'Jobs', id: `referrers-${jobId}` }],
    }),

    createReferrer: builder.mutation<
      ReferrerResponse,
      { jobId: string; name: string; phone: string | null }
    >({
      query: ({ jobId, name, phone }) => ({
        url: `${API}/recruiter/v2/jobs/${jobId}/referrers`,
        method: 'POST',
        body: { name, phone },
      }),
      transformResponse: (res: ApiResponse<ReferrerResponse>) => res.data,
      invalidatesTags: (_r, _e, { jobId }) => [{ type: 'Jobs', id: `referrers-${jobId}` }],
    }),

    /** Everyone who applied to any job, one row per person. */
    getCompanyPeople: builder.query<CompanyPerson[], void>({
      query: () => ({ url: `${API}/applications/company/me/candidates`, params: { size: 200 } }),
      transformResponse: (res: ApiResponse<CompanyPerson[]>) => res.data,
      providesTags: ['Candidates', 'Applications'],
    }),

    /** Search CVs: "used Tally", "ICU nurse", "5 years teaching". */
    searchPeople: builder.query<PeopleSearchResponse, string>({
      query: (q) => ({
        url: `${API}/applications/company/me/candidates/search`,
        params: { q, size: 50 },
      }),
      transformResponse: (res: ApiResponse<PeopleSearchResponse>) => res.data,
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
  useClearFlagMutation,
  useQuickAddMutation,
  useListReferrersQuery,
  useCreateReferrerMutation,
  useGetCompanyPeopleQuery,
  useLazySearchPeopleQuery,
} = recruiterApi

/** Job page link that opens one applicant: /recruiter/jobs/{job}?stage=…&app=… */
export function applicantHref(jobId: string, applicationId: string, stage?: Stage | null) {
  const params = new URLSearchParams()
  if (stage && stage !== 'new') params.set('stage', stage)
  params.set('app', applicationId)
  return `/recruiter/jobs/${jobId}?${params}`
}

// ---------------------------------------------------------------------------
// Raw fetch for streams and file downloads (refreshes the token once on 401)
// ---------------------------------------------------------------------------

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
  const { token } = await refreshSession()
  if (!token) return response
  store.dispatch(updateAccessToken(token))
  return send(token)
}

/** Download every applicant for a job as a CSV file (opens in Excel). */
export async function exportPipelineCsv(jobId: string): Promise<void> {
  const response = await authedFetch(`${API}/recruiter/v2/jobs/${jobId}/export.csv`)
  if (!response.ok) throw new Error(String(response.status))
  const name =
    /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ??
    'applicants.csv'
  const link = document.createElement('a')
  link.href = URL.createObjectURL(await response.blob())
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
}

// ---------------------------------------------------------------------------
// Assistant (SSE): `token` {text}… then `final` {…} or `error` {code, message}
// ---------------------------------------------------------------------------

type StreamHandlers = { onToken?: (text: string) => void; signal?: AbortSignal }

export type AssistantErrorCode =
  | 'busy'
  | 'timeout'
  | 'unavailable'
  | 'invalid'
  | 'blocked'
  | 'network'

/** A friendly message to show inline where the answer would be. */
export class AssistantError extends Error {
  constructor(
    public code: AssistantErrorCode,
    message: string,
  ) {
    super(message)
  }
}

const NETWORK_MESSAGE = "Couldn't reach the assistant. Check your connection and try again."

async function streamSse<T>(
  url: string,
  body: unknown,
  { onToken, signal }: StreamHandlers,
): Promise<T> {
  let response: Response
  try {
    response = await authedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new AssistantError('network', NETWORK_MESSAGE)
  }
  if (response.status === 429)
    throw new AssistantError('busy', 'Too many questions at once. Wait a minute and try again.')
  if (!response.ok || !response.body) throw new AssistantError('unavailable', NETWORK_MESSAGE)
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
        else if (event === 'error')
          throw new AssistantError(
            (parsed.code as AssistantErrorCode) ?? 'unavailable',
            String(parsed.message ?? NETWORK_MESSAGE),
          )
      }
      boundary = buffer.indexOf('\n\n')
    }
    if (done) break
  }
  if (!final) throw new AssistantError('timeout', 'The answer was cut off. Try again.')
  return final
}

/** The builder fields a job draft can fill. */
export type DraftFields = Partial<
  Pick<
    JobFields,
    | 'title'
    | 'location'
    | 'location_type'
    | 'employment_type'
    | 'category'
    | 'salary_min'
    | 'salary_max'
    | 'currency'
    | 'description'
    | 'must_haves'
    | 'nice_to_haves'
    | 'questions'
  >
>

/** backend/app/modules/assistant/schemas.py JobDraft: category by label, work_type. */
type WireDraft = Omit<DraftFields, 'category' | 'location_type' | 'questions'> & {
  category?: string | null
  work_type?: LocationType | null
  questions?: Omit<JobQuestion, 'knockout_answer'>[]
}

function fromWireDraft(wire: WireDraft | null | undefined): DraftFields {
  if (!wire) return {}
  const { category, work_type, questions, ...rest } = wire
  return {
    ...rest,
    category: JOB_CATEGORIES.find((c) => c.label === category)?.value ?? undefined,
    location_type: work_type ?? undefined,
    questions: questions?.map((q) => ({ ...q, knockout_answer: null })),
  }
}

function toWireDraft(draft: DraftFields): WireDraft {
  const { category, location_type, questions, must_haves, ...rest } = draft
  return {
    ...rest,
    category: JOB_CATEGORIES.find((c) => c.value === category)?.label ?? null,
    work_type: location_type ?? null,
    questions: questions
      ?.filter((q) => q.label.trim())
      .map(({ label, type, required }) => ({ label, type, required })),
    must_haves: must_haves?.filter((m) => m.trim()),
  }
}

export type JobDraftTurn = {
  draft_id: string
  reply: string
  /** When true, `reply` is a question the person should answer. */
  follow_up: boolean
  draft: DraftFields
  sources: { title: string | null; url: string }[]
}

/** One turn with the job-draft assistant; sends the page's fields so edits are kept. */
export async function streamJobDraft(
  { message, draft_id, draft }: { message: string; draft_id?: string | null; draft?: DraftFields },
  handlers: StreamHandlers = {},
): Promise<JobDraftTurn> {
  const final = await streamSse<Omit<JobDraftTurn, 'draft'> & { draft: WireDraft }>(
    `${API}/assistant/job-draft`,
    { message, draft_id: draft_id ?? undefined, draft: draft ? toWireDraft(draft) : undefined },
    handlers,
  )
  return { ...final, draft: fromWireDraft(final.draft) }
}

/** A saved assistant draft (/recruiter/jobs/new?draftId=…). */
export async function loadDraft(draftId: string): Promise<DraftFields | null> {
  try {
    const response = await authedFetch(`${API}/assistant/job-draft/${draftId}`)
    if (!response.ok) return null
    const body = (await response.json()) as ApiResponse<{ draft: WireDraft | null }>
    return body.data?.draft ? fromWireDraft(body.data.draft) : null
  } catch {
    return null
  }
}

export type QuoteSource = 'cv' | 'answers' | 'review' | 'scorecards' | 'activity'

export type CandidateAnswer = {
  answer: string
  quotes: { text: string; source: QuoteSource }[]
  /** "email" has no button; the panel's contact links cover it. */
  suggested_action: { action: 'shortlist' | 'reject'; application_ids: string[] } | null
  cv_available: boolean
}

type WireAnswer = Omit<CandidateAnswer, 'suggested_action'> & {
  suggested_action: { action: 'shortlist' | 'reject' | 'email'; application_ids: string[] } | null
}

export async function streamCandidateQuestion(
  applicationId: string,
  { message }: { message: string },
  handlers: StreamHandlers = {},
): Promise<CandidateAnswer> {
  const final = await streamSse<WireAnswer>(
    `${API}/assistant/candidates/${applicationId}`,
    { message },
    handlers,
  )
  const action = final.suggested_action
  return {
    ...final,
    quotes: final.quotes ?? [],
    suggested_action:
      action && action.action !== 'email'
        ? { action: action.action, application_ids: action.application_ids }
        : null,
  }
}

export type AssistantMessage = {
  role: 'user' | 'assistant'
  content: string
  created_at: string
  quotes: CandidateAnswer['quotes']
}

/** Earlier questions and answers about this applicant. */
export async function getCandidateHistory(applicationId: string): Promise<AssistantMessage[]> {
  try {
    const response = await authedFetch(`${API}/assistant/candidates/${applicationId}`)
    if (!response.ok) return []
    const body = (await response.json()) as ApiResponse<{ messages: AssistantMessage[] }>
    return body.data?.messages ?? []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Protected grounds (Labour Act 2074 §6, Constitution Art. 18): instant hint
// while typing; the backend returns the same check as `warnings` on save.
// ---------------------------------------------------------------------------

const PROTECTED =
  /\b(male|female|man|woman|men|women|girls?|boys?|gender|sex|age[ds]?\s*\d|\d+\s*(-|to|–)\s*\d+\s*(years|yrs)\s*(old|of age)|under\s*\d+|below\s*\d+\s*years|above\s*\d+\s*years|years old|unmarried|married|single|marital|religio\w*|hindu|muslim|christian|buddhist|caste|brahmin|chhetri|newar|janajati|dalit|ethnic\w*|pregnan\w*|good[- ]looking|attractive|fair (skin|complexion)|height|disab\w*|hiv|political|party member)\b|पुरुष|महिला|केटी|केटा|उमेर|अविवाहित|विवाहित|जात|धर्म/i

export const PROTECTED_WARNING =
  'This may be discrimination under the Labour Act — remove or reword'

export function protectedGroundWarning(criterion: string): string | null {
  return PROTECTED.test(criterion) ? PROTECTED_WARNING : null
}

// ---------------------------------------------------------------------------
// Sharing helpers
// ---------------------------------------------------------------------------

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
