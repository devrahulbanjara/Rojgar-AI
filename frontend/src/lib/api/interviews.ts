/**
 * Interviews adapter. Screens use only these shapes; the backend behind them is
 * changing (B2 is replacing Cal.com with native scheduling).
 *
 * - FLAGS.nativeScheduling on  → the new endpoints listed on each function.
 * - FLAGS.nativeScheduling off → today's endpoints, with the gaps filled as
 *   described inline.
 */
import { FLAGS } from '@/lib/flags'
import type { ApplicationStatus } from '@/store/services/applicationsApi'
import { type ApiResponse, baseApi } from '@/store/services/baseApi'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/** not_due: still ahead · due: time has passed, no scorecard yet · done: scorecard in. */
export type ScorecardState = 'not_due' | 'due' | 'done'

export interface Interview {
  id: string
  application_id: string
  starts_at: string
  ends_at: string
  candidate: { name: string; avatar_url: string | null }
  job: { id: string; title: string }
  meeting_url: string | null
  scorecard_state: ScorecardState
}

/** upcoming: today onwards, plus earlier ones that still need a scorecard. */
export type InterviewRange = 'upcoming' | 'all'

export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
/** Nepal's working week starts on Sunday. */
export const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export interface TimeRange {
  /** "09:00", 24-hour local time */
  start: string
  end: string
}

export interface Availability {
  days: Record<Weekday, TimeRange[]>
  length_minutes: number
  buffer_minutes: number
  /** A fixed video link, or 'auto' to create one per interview. */
  meeting_link: string | 'auto'
  /** IANA zone the hours are in. */
  timezone: string
}

export type Recommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no'

export interface Scorecard {
  /** criterion → 1 (poor) … 4 (excellent) */
  ratings: Record<string, number>
  recommendation: Recommendation
  notes: string
}

/** What the scorecard form can ask for this interview. */
export interface ScorecardTemplate {
  criteria: string[]
  /** false when only "mark as done" can be saved (old backend, job without criteria). */
  full: boolean
}

// ---------------------------------------------------------------------------
// Fallback mapping (current backend)
// ---------------------------------------------------------------------------

interface LegacyInterview {
  id: string
  application_id: string
  candidate_name: string
  applicant_avatar_url: string | null
  start_time: string
  end_time: string
  location: string | null
  application_status: ApplicationStatus
  job_id: string
  job_title: string
}

const isUrl = (value: string | null | undefined): value is string =>
  !!value && /^https?:\/\//i.test(value)

function legacyScorecardState(item: LegacyInterview, now: number): ScorecardState {
  if (item.application_status !== 'interview_booked') return 'done'
  return new Date(item.end_time).getTime() <= now ? 'due' : 'not_due'
}

function fromLegacy(item: LegacyInterview, now: number): Interview {
  return {
    id: item.id,
    application_id: item.application_id,
    starts_at: item.start_time,
    ends_at: item.end_time,
    candidate: { name: item.candidate_name, avatar_url: item.applicant_avatar_url },
    job: { id: item.job_id, title: item.job_title },
    meeting_url: isUrl(item.location) ? item.location : null,
    scorecard_state: legacyScorecardState(item, now),
  }
}

const DEFAULT_DAY: TimeRange[] = [{ start: '09:00', end: '17:00' }]
export const DEFAULT_AVAILABILITY: Availability = {
  days: {
    sun: DEFAULT_DAY,
    mon: DEFAULT_DAY,
    tue: DEFAULT_DAY,
    wed: DEFAULT_DAY,
    thu: DEFAULT_DAY,
    fri: DEFAULT_DAY,
    sat: [],
  },
  length_minutes: 30,
  buffer_minutes: 10,
  meeting_link: 'auto',
  timezone: 'Asia/Kathmandu',
}

// Until B2 ships availability, the weekly hours and meeting link live in this
// browser; length and buffer already have a home in recruiter preferences.
const LOCAL_KEY = 'rojgar:availability'

function readLocal(): Pick<Availability, 'days' | 'meeting_link'> | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as Pick<Availability, 'days' | 'meeting_link'>) : null
  } catch {
    return null
  }
}

function writeLocal(value: Pick<Availability, 'days' | 'meeting_link'>) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(value))
  } catch {
    // Storage blocked: the hours simply aren't remembered on this device.
  }
}

const RATING_MAX = 4

function rangeParams(range: InterviewRange): Record<string, string> | undefined {
  if (range === 'all') return undefined
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 14)
  return { start: start.toISOString() }
}

type Fail = { error: FetchBaseQueryError }

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const interviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * New: GET /interviews?range=upcoming|all → Interview[]
     * Old: GET /interviews/?start=… mapped to Interview.
     */
    listInterviews: builder.query<Interview[], { range: InterviewRange }>({
      async queryFn({ range }, _api, _extra, baseQuery) {
        const now = Date.now()
        if (FLAGS.nativeScheduling) {
          const res = await baseQuery({ url: `${API}/interviews`, params: { range } })
          if (res.error) return { error: res.error }
          return { data: (res.data as ApiResponse<Interview[]>).data }
        }
        const res = await baseQuery({ url: `${API}/interviews/`, params: rangeParams(range) })
        if (res.error) return { error: res.error }
        const items = (res.data as ApiResponse<LegacyInterview[]>).data.map((item) =>
          fromLegacy(item, now),
        )
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const visible =
          range === 'all'
            ? items
            : items.filter(
                (item) =>
                  new Date(item.starts_at) >= startOfToday || item.scorecard_state === 'due',
              )
        return { data: visible.sort((a, b) => a.starts_at.localeCompare(b.starts_at)) }
      },
      providesTags: ['Interviews'],
    }),

    /**
     * New: GET /interviews/availability → Availability
     * Old: length/buffer from /recruiter/preferences, the rest from this browser.
     */
    getAvailability: builder.query<Availability, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        if (FLAGS.nativeScheduling) {
          const res = await baseQuery(`${API}/interviews/availability`)
          if (res.error) return { error: res.error }
          return { data: (res.data as ApiResponse<Availability>).data }
        }
        const res = await baseQuery(`${API}/recruiter/preferences`)
        if (res.error) return { error: res.error }
        const prefs = (
          res.data as ApiResponse<{
            timezone: string | null
            default_interview_duration_minutes: number
            default_interview_buffer_minutes: number
          }>
        ).data
        return {
          data: {
            ...DEFAULT_AVAILABILITY,
            ...readLocal(),
            length_minutes: prefs.default_interview_duration_minutes,
            buffer_minutes: prefs.default_interview_buffer_minutes,
            timezone: prefs.timezone || DEFAULT_AVAILABILITY.timezone,
          },
        }
      },
      providesTags: ['Availability'],
    }),

    /** New: PUT /interviews/availability (body: Availability). */
    saveAvailability: builder.mutation<Availability, Availability>({
      async queryFn(body, _api, _extra, baseQuery) {
        if (FLAGS.nativeScheduling) {
          const res = await baseQuery({
            url: `${API}/interviews/availability`,
            method: 'PUT',
            body,
          })
          if (res.error) return { error: res.error }
          return { data: (res.data as ApiResponse<Availability>).data }
        }
        const res = await baseQuery({
          url: `${API}/recruiter/preferences`,
          method: 'PATCH',
          body: {
            default_interview_duration_minutes: body.length_minutes,
            default_interview_buffer_minutes: body.buffer_minutes,
            timezone: body.timezone,
          },
        })
        if (res.error) return { error: res.error }
        writeLocal({ days: body.days, meeting_link: body.meeting_link })
        return { data: body }
      },
      invalidatesTags: ['Availability', 'RecruiterPreferences'],
    }),

    /**
     * New: POST /interviews/invite {application_id} → {scheduling_url}
     *      (the candidate's self-booking link; the invite email carries it).
     * Old: the company's Cal.com booking link.
     */
    inviteToInterview: builder.mutation<{ scheduling_url: string }, string>({
      async queryFn(applicationId, _api, _extra, baseQuery) {
        if (FLAGS.nativeScheduling) {
          const res = await baseQuery({
            url: `${API}/interviews/invite`,
            method: 'POST',
            body: { application_id: applicationId },
          })
          if (res.error) return { error: res.error }
          return { data: (res.data as ApiResponse<{ scheduling_url: string }>).data }
        }
        const res = await baseQuery(`${API}/companies/me`)
        if (res.error) return { error: res.error }
        const url = (res.data as ApiResponse<{ cal_booking_url: string | null }>).data
          .cal_booking_url
        if (!url) {
          return {
            error: { status: 400, data: { message: 'Add a booking link first.' } },
          } satisfies Fail
        }
        return { data: { scheduling_url: url } }
      },
      invalidatesTags: ['Interviews', 'Applications'],
    }),

    /**
     * New: POST /interviews/{id}/reschedule → {scheduling_url}; the candidate is
     *      emailed a link to pick a new time.
     * Old: Cal.com's reschedule page for the booking.
     */
    rescheduleInterview: builder.mutation<{ scheduling_url: string; sent: boolean }, string>({
      async queryFn(interviewId, _api, _extra, baseQuery) {
        if (FLAGS.nativeScheduling) {
          const res = await baseQuery({
            url: `${API}/interviews/${interviewId}/reschedule`,
            method: 'POST',
          })
          if (res.error) return { error: res.error }
          const data = (res.data as ApiResponse<{ scheduling_url: string }>).data
          return { data: { ...data, sent: true } }
        }
        const res = await baseQuery({ url: `${API}/interviews/`, params: rangeParams('all') })
        if (res.error) return { error: res.error }
        const match = (
          res.data as ApiResponse<{ id: string; cal_booking_uid: string }[]>
        ).data.find((item) => item.id === interviewId)
        if (!match?.cal_booking_uid) {
          return {
            error: { status: 404, data: { message: 'Interview not found.' } },
          } satisfies Fail
        }
        return {
          data: {
            scheduling_url: `https://cal.com/reschedule/${encodeURIComponent(match.cal_booking_uid)}`,
            sent: false,
          },
        }
      },
      invalidatesTags: ['Interviews'],
    }),

    /**
     * New: GET /interviews/{id}/scorecard-template → ScorecardTemplate
     *      (criteria = the job's must-haves).
     * Old: the job's evaluation criteria, if it has any.
     */
    getScorecardTemplate: builder.query<ScorecardTemplate, { id: string; jobId: string }>({
      async queryFn({ id, jobId }, _api, _extra, baseQuery) {
        if (FLAGS.nativeScheduling) {
          const res = await baseQuery(`${API}/interviews/${id}/scorecard-template`)
          if (res.error) return { error: res.error }
          return { data: (res.data as ApiResponse<ScorecardTemplate>).data }
        }
        const res = await baseQuery(`${API}/interviews/jobs/${jobId}/evaluation-schema`)
        const schema = res.error
          ? null
          : (res.data as ApiResponse<{ criteria: { label: string }[] } | null>).data
        return {
          data: schema
            ? { criteria: schema.criteria.map((c) => c.label), full: true }
            : { criteria: [], full: false },
        }
      },
    }),

    /**
     * New: POST /interviews/{id}/scorecard (body: Scorecard).
     * Old: a recruiter evaluation row (when the job has criteria), then mark
     *      the interview done.
     */
    submitScorecard: builder.mutation<
      null,
      { id: string; applicationId: string; jobId: string; scorecard: Scorecard | null }
    >({
      async queryFn({ id, applicationId, jobId, scorecard }, api, _extra, baseQuery) {
        if (FLAGS.nativeScheduling) {
          const res = await baseQuery({
            url: `${API}/interviews/${id}/scorecard`,
            method: 'POST',
            body: scorecard,
          })
          return res.error ? { error: res.error } : { data: null }
        }
        if (scorecard) {
          const schemaRes = await baseQuery(`${API}/interviews/jobs/${jobId}/evaluation-schema`)
          const schema = schemaRes.error
            ? null
            : (
                schemaRes.data as ApiResponse<{
                  criteria: { key: string; label: string; max_score: number }[]
                } | null>
              ).data
          if (schema) {
            const scores: Record<string, number | null> = {}
            for (const criterion of schema.criteria) {
              const rating = scorecard.ratings[criterion.label]
              scores[criterion.key] = rating
                ? Math.round((rating / RATING_MAX) * criterion.max_score * 10) / 10
                : null
            }
            const state = api.getState() as { auth: { user: { full_name: string } | null } }
            const notes = [RECOMMENDATION_LABEL[scorecard.recommendation], scorecard.notes.trim()]
              .filter(Boolean)
              .join('\n\n')
            const res = await baseQuery({
              url: `${API}/interviews/applications/${applicationId}/evaluation/human`,
              method: 'POST',
              body: {
                evaluator_label: state.auth.user?.full_name || 'Recruiter',
                scores,
                notes,
              },
            })
            if (res.error) return { error: res.error }
          }
        }
        const done = await baseQuery({ url: `${API}/interviews/${id}/complete`, method: 'POST' })
        return done.error ? { error: done.error } : { data: null }
      },
      invalidatesTags: ['Interviews', 'Applications', 'Evaluation'],
    }),
  }),
})

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  strong_yes: 'Strong yes',
  yes: 'Yes',
  no: 'No',
  strong_no: 'Strong no',
}

export const {
  useListInterviewsQuery,
  useGetAvailabilityQuery,
  useSaveAvailabilityMutation,
  useInviteToInterviewMutation,
  useRescheduleInterviewMutation,
  useGetScorecardTemplateQuery,
  useSubmitScorecardMutation,
} = interviewsApi
