/**
 * Interviews: agenda, weekly availability, invites and scorecards.
 * Screens use only these shapes; this file maps them to the scheduling API.
 */
import { type ApiResponse, baseApi } from '@/store/services/baseApi'

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

// ---------------------------------------------------------------------------
// API shapes and mapping
// ---------------------------------------------------------------------------

/** backend/app/modules/interviews/schemas.py AgendaItem */
interface AgendaItem {
  id: string
  application_id: string
  job_id: string
  job_title: string
  candidate_name: string
  candidate_email: string | null
  interviewer_name: string | null
  start: string
  end: string
  timezone: string
  meeting_link: string
  status: string
  scorecard: 'not_due' | 'needed' | 'done'
}

interface ApiAvailability {
  timezone: string
  weekly_hours: Partial<Record<Weekday, string[][]>>
  interview_minutes: number
  buffer_minutes: number
  meeting_link: string
}

const SCORECARD_STATE: Record<AgendaItem['scorecard'], ScorecardState> = {
  not_due: 'not_due',
  needed: 'due',
  done: 'done',
}

function fromAgenda(item: AgendaItem): Interview {
  return {
    id: item.id,
    application_id: item.application_id,
    starts_at: item.start,
    ends_at: item.end,
    candidate: { name: item.candidate_name, avatar_url: null },
    job: { id: item.job_id, title: item.job_title },
    meeting_url: item.meeting_link || null,
    scorecard_state: SCORECARD_STATE[item.scorecard],
  }
}

function fromApiAvailability(data: ApiAvailability): Availability {
  const days = Object.fromEntries(
    WEEKDAYS.map((day) => [
      day,
      (data.weekly_hours[day] ?? []).map(([start, end]) => ({ start, end })),
    ]),
  ) as Record<Weekday, TimeRange[]>
  return {
    days,
    length_minutes: data.interview_minutes,
    buffer_minutes: data.buffer_minutes,
    meeting_link: data.meeting_link,
    timezone: data.timezone,
  }
}

function toApiAvailability(value: Availability): ApiAvailability {
  return {
    timezone: value.timezone,
    weekly_hours: Object.fromEntries(
      WEEKDAYS.map((day) => [day, value.days[day].map(({ start, end }) => [start, end])]),
    ),
    interview_minutes: value.length_minutes,
    buffer_minutes: value.buffer_minutes,
    meeting_link: value.meeting_link,
  }
}

const DEFAULT_DAY: TimeRange[] = [{ start: '10:00', end: '17:00' }]
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
  length_minutes: 45,
  buffer_minutes: 15,
  meeting_link: 'auto',
  timezone: 'Asia/Kathmandu',
}

/** YYYY-MM-DD in local time, `daysFromToday` away. */
function localDate(daysFromToday: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const interviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** upcoming: the last two weeks (for missing scorecards) and the month ahead. */
    listInterviews: builder.query<Interview[], { range: InterviewRange }>({
      query: ({ range }) => ({
        url: `${API}/interviews`,
        params: { range: 'month', start: localDate(range === 'all' ? -60 : -14) },
      }),
      transformResponse: (res: ApiResponse<AgendaItem[]>) => {
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        return res.data
          .filter((item) => item.status !== 'cancelled')
          .map(fromAgenda)
          .filter(
            (item) =>
              new Date(item.starts_at) >= startOfToday || item.scorecard_state !== 'not_due',
          )
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      },
      providesTags: ['Interviews'],
    }),

    getAvailability: builder.query<Availability, void>({
      query: () => `${API}/me/availability`,
      transformResponse: (res: ApiResponse<ApiAvailability>) => fromApiAvailability(res.data),
      providesTags: ['Availability'],
    }),

    saveAvailability: builder.mutation<Availability, Availability>({
      query: (body) => ({
        url: `${API}/me/availability`,
        method: 'PUT',
        body: toApiAvailability(body),
      }),
      transformResponse: (res: ApiResponse<ApiAvailability>) => fromApiAvailability(res.data),
      invalidatesTags: ['Availability'],
    }),

    /** Re-sends the same link; the applicant picks a new time from it. */
    rescheduleInterview: builder.mutation<{ scheduling_url: string; sent: boolean }, string>({
      query: (applicationId) => ({
        url: `${API}/applications/${applicationId}/invite`,
        method: 'POST',
        body: { notify: true },
      }),
      transformResponse: (res: ApiResponse<{ scheduling_url: string }>) => ({
        ...res.data,
        sent: true,
      }),
      invalidatesTags: ['Interviews'],
    }),

    /** The job's must-haves to rate, and notes already written. */
    getScorecardTemplate: builder.query<{ criteria: string[] }, string>({
      query: (id) => `${API}/interviews/${id}/scorecard`,
      transformResponse: (res: ApiResponse<{ criteria: string[] }>) => ({
        criteria: res.data.criteria,
      }),
    }),

    submitScorecard: builder.mutation<null, { id: string; scorecard: Scorecard }>({
      query: ({ id, scorecard }) => ({
        url: `${API}/interviews/${id}/scorecard`,
        method: 'POST',
        body: {
          ratings: Object.entries(scorecard.ratings).map(([criterion, rating]) => ({
            criterion,
            rating: Math.min(4, Math.max(1, rating)),
          })),
          recommendation: scorecard.recommendation,
          notes: scorecard.notes || null,
        },
      }),
      transformResponse: () => null,
      invalidatesTags: ['Interviews', 'Applications'],
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
  useRescheduleInterviewMutation,
  useGetScorecardTemplateQuery,
  useSubmitScorecardMutation,
} = interviewsApi
