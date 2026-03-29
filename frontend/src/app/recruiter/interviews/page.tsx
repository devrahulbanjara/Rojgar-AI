'use client'

import { type CSSProperties, Fragment, type KeyboardEvent } from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getInitials } from '@/lib/mediaValidation'
import { type InterviewItem, useGetInterviewsQuery } from '@/store/services/interviewsApi'
import { useGetCompanyJobsQuery, useSetHiringCompletedMutation } from '@/store/services/jobsApi'
import { CalendarDays, ChevronDown, ChevronRight, Hash, Mail, MapPin } from 'lucide-react'

import ButtonSpinner from '@/components/common/ButtonSpinner'
import StatusPill from '@/components/common/StatusPill'

import { InterviewsTableSkeleton } from './_components/InterviewsSkeletons'
import styles from './page.module.css'

type DatePreset = 'today' | 'week' | 'month' | 'custom'
type InterviewBucket =
  | 'today'
  | 'tomorrow'
  | 'thisWeek'
  | 'nextWeek'
  | 'later'
  | 'yesterday'
  | 'past'

const DEFAULT_OPEN_SECTIONS: Record<InterviewBucket, boolean> = {
  today: true,
  tomorrow: true,
  thisWeek: true,
  nextWeek: false,
  later: false,
  yesterday: false,
  past: false,
}

const SECTION_META: Record<
  InterviewBucket,
  { label: string; description: string; tone: 'future' | 'past' }
> = {
  today: {
    label: 'Today',
    description: 'Interviews that need attention right now.',
    tone: 'future',
  },
  tomorrow: {
    label: 'Tomorrow',
    description: 'Next-up interviews for immediate prep.',
    tone: 'future',
  },
  thisWeek: {
    label: 'This week',
    description: 'Later this week, grouped for quick planning.',
    tone: 'future',
  },
  nextWeek: {
    label: 'Next week',
    description: 'Upcoming interviews beyond this week.',
    tone: 'future',
  },
  later: {
    label: 'Later',
    description: 'Future interviews scheduled further out.',
    tone: 'future',
  },
  yesterday: {
    label: 'Yesterday',
    description: 'Recent interviews kept close for follow-up.',
    tone: 'past',
  },
  past: {
    label: 'Past',
    description: 'Older interviews kept as reference.',
    tone: 'past',
  },
}

const SECTION_ORDER: InterviewBucket[] = [
  'today',
  'tomorrow',
  'thisWeek',
  'nextWeek',
  'later',
  'yesterday',
  'past',
]

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function startOfWeek(date: Date) {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(date)
  start.setDate(date.getDate() + diff)
  return startOfDay(start)
}

function endOfWeek(date: Date) {
  const end = startOfWeek(date)
  end.setDate(end.getDate() + 6)
  return endOfDay(end)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimeRange(interview: InterviewItem) {
  const start = new Date(interview.start_time)
  const end = new Date(interview.end_time)
  const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${timeFmt.format(start)} - ${timeFmt.format(end)}`
}

function formatDateStamp(interview: InterviewItem) {
  return new Date(interview.start_time).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTimeLine(interview: InterviewItem) {
  return `${formatDateStamp(interview)} · ${formatTimeRange(interview)}`
}

function getLocationLabel(value: string | null) {
  return value?.trim() || 'Location TBD'
}

function getAvatarColor(name: string): string {
  const colors = ['#0f766e', '#2563eb', '#dc2626', '#9333ea', '#d97706', '#0891b2']
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return colors[seed % colors.length]
}

function getInterviewBucket(interview: InterviewItem, today: Date): InterviewBucket {
  const interviewDate = startOfDay(new Date(interview.start_time))
  const currentDay = startOfDay(today)
  const diffDays = Math.round((interviewDate.getTime() - currentDay.getTime()) / 86_400_000)

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'

  const thisWeekStart = startOfWeek(today)
  const thisWeekEnd = endOfWeek(today)
  const nextWeekStart = startOfDay(
    new Date(thisWeekEnd.getFullYear(), thisWeekEnd.getMonth(), thisWeekEnd.getDate() + 1),
  )
  const nextWeekEnd = endOfWeek(nextWeekStart)

  if (
    interviewDate > currentDay &&
    interviewDate >= thisWeekStart &&
    interviewDate <= thisWeekEnd
  ) {
    return 'thisWeek'
  }

  if (interviewDate >= nextWeekStart && interviewDate <= nextWeekEnd) {
    return 'nextWeek'
  }

  if (interviewDate > nextWeekEnd) {
    return 'later'
  }

  return 'past'
}

export default function RecruiterInterviewsPage() {
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const [preset, setPreset] = useState<DatePreset>('month')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [customStart, setCustomStart] = useState(toInputDate(startOfWeek(today)))
  const [customEnd, setCustomEnd] = useState(toInputDate(endOfWeek(today)))
  const [openSections, setOpenSections] =
    useState<Record<InterviewBucket, boolean>>(DEFAULT_OPEN_SECTIONS)

  const range = useMemo(() => {
    if (preset === 'today') {
      return { start: startOfDay(today), end: endOfDay(today) }
    }
    if (preset === 'month') {
      return { start: startOfMonth(today), end: endOfMonth(today) }
    }
    if (preset === 'custom') {
      const start = startOfDay(new Date(customStart))
      const end = endOfDay(new Date(customEnd))
      return { start, end }
    }
    return { start: startOfWeek(today), end: endOfWeek(today) }
  }, [customEnd, customStart, preset, today])

  const { data: jobsResp, isLoading: isLoadingJobs } = useGetCompanyJobsQuery()
  const [setHiringCompleted, { isLoading: isUpdatingHiringCompleted }] =
    useSetHiringCompletedMutation()

  const jobs = useMemo(() => jobsResp?.data ?? [], [jobsResp?.data])
  const jobOptions = useMemo(
    () =>
      jobs.filter(
        (job) => job.status === 'active' || job.id === selectedJobId || job.hiring_completed,
      ),
    [jobs, selectedJobId],
  )

  const selectedJob = jobOptions.find((job) => job.id === selectedJobId) ?? null

  const interviewsParams = useMemo(
    () => ({
      ...(selectedJobId ? { job_id: selectedJobId } : {}),
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    }),
    [range.end, range.start, selectedJobId],
  )

  const {
    data: interviewsResp,
    isLoading: isLoadingInterviews,
    refetch,
  } = useGetInterviewsQuery(interviewsParams)

  const interviews = useMemo(() => interviewsResp?.data ?? [], [interviewsResp?.data])
  const sortedInterviews = useMemo(
    () =>
      [...interviews].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      ),
    [interviews],
  )

  const groupedSections = useMemo(() => {
    const sections = SECTION_ORDER.reduce(
      (accumulator, key) => {
        accumulator[key] = []
        return accumulator
      },
      {} as Record<InterviewBucket, InterviewItem[]>,
    )

    for (const interview of sortedInterviews) {
      sections[getInterviewBucket(interview, today)].push(interview)
    }

    return SECTION_ORDER.filter((key) => sections[key].length > 0).map((key) => ({
      key,
      ...SECTION_META[key],
      items: sections[key],
    }))
  }, [sortedInterviews, today])

  const hasFutureSections = groupedSections.some((section) => section.tone === 'future')
  const hasPastSections = groupedSections.some((section) => section.tone === 'past')

  async function handleMarkHiringComplete() {
    if (!selectedJob) return

    try {
      await setHiringCompleted({
        id: selectedJob.id,
        hiring_completed: true,
      }).unwrap()
      toast.success('Hiring marked complete.')
      void refetch()
    } catch {
      toast.error('Could not update hiring status.')
    }
  }

  function toggleSection(section: InterviewBucket) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLElement>, interviewId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const interview = sortedInterviews.find((item) => item.id === interviewId)
      if (interview) {
        router.push(`/recruiter/candidates/${interview.application_id}`)
      }
    }
  }

  const isLoading = isLoadingJobs || isLoadingInterviews

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Interviews</h2>
          <p className="dash-page-header__subtitle">
            Scheduled meetings with candidates. Filter by date and job, then scan grouped buckets
            before drilling into individual interview rows.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className="page-header-hint">
            {isLoading
              ? 'Loading...'
              : `${sortedInterviews.length} interview${sortedInterviews.length === 1 ? '' : 's'}`}
          </span>
          {selectedJob && !selectedJob.hiring_completed ? (
            <button
              className="btn btn--primary btn--sm"
              disabled={isUpdatingHiringCompleted}
              onClick={() => void handleMarkHiringComplete()}
            >
              {isUpdatingHiringCompleted ? (
                <ButtonSpinner label="Updating..." />
              ) : (
                'Mark hiring complete'
              )}
            </button>
          ) : null}
          {selectedJob?.hiring_completed ? (
            <span className="badge badge--success">Hiring complete</span>
          ) : null}
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filtersGrid}>
          <label className={styles.selectField}>
            <span className={styles.fieldLabel}>Date range</span>
            <select
              className={styles.select}
              value={preset}
              onChange={(event) => setPreset(event.target.value as DatePreset)}
            >
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="custom">Custom range...</option>
            </select>
          </label>

          <label className={styles.selectField}>
            <span className={styles.fieldLabel}>Job</span>
            <select
              className={styles.select}
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
            >
              <option value="">All jobs</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>

          {preset === 'custom' ? (
            <div className={styles.customRange}>
              <label className={styles.dateField}>
                <span className={styles.fieldLabel}>From</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                />
              </label>
              <label className={styles.dateField}>
                <span className={styles.fieldLabel}>To</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={customEnd}
                  min={customStart}
                  onChange={(event) => setCustomEnd(event.target.value)}
                />
              </label>
            </div>
          ) : null}
          </div>
      </div>

      {isLoading ? (
        <InterviewsTableSkeleton count={4} />
      ) : sortedInterviews.length === 0 ? (
        <div className="dash-card">
          <div className="dash-card__body dash-empty-state">
            <CalendarDays className="dash-empty-state__icon" />
            <p>
              <strong>No interviews in this range.</strong>
            </p>
            <p className="cell-muted">
              Try a wider date range or a different job. Bookings from your scheduling integration
              appear here automatically.
            </p>
            <Link href="/recruiter/outreach" className="btn btn--primary btn--sm">
              Open outreach
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className="dash-card">
            <div className={`dash-card__body ${styles.timelineBody}`}>
              {groupedSections.map((section, index) => {
                const isOpen = openSections[section.key]
                const showPastDivider =
                  section.tone === 'past' &&
                  hasFutureSections &&
                  hasPastSections &&
                  (index === 0 || groupedSections[index - 1]?.tone !== 'past')

                return (
                  <Fragment key={section.key}>
                    {showPastDivider ? (
                      <div className={styles.timelineDivider}>
                        <span>Past interviews</span>
                      </div>
                    ) : null}

                    <section className={styles.section}>
                      <button
                        type="button"
                        className={styles.sectionHeader}
                        onClick={() => toggleSection(section.key)}
                      >
                        <div className={styles.sectionTitleGroup}>
                          <span className={styles.sectionLabel}>{section.label}</span>
                          <span className={styles.sectionCount}>{section.items.length}</span>
                        </div>
                        <span className={styles.sectionDescription}>{section.description}</span>
                        {isOpen ? (
                          <ChevronDown size={16} aria-hidden="true" />
                        ) : (
                          <ChevronRight size={16} aria-hidden="true" />
                        )}
                      </button>

                      {isOpen ? (
                        <div className={styles.rows}>
                          {section.items.map((interview) => {
                            const accent = getAvatarColor(interview.candidate_name)
                            const avatarUrl = interview.applicant_avatar_url

                            return (
                              <article
                                key={interview.id}
                                className={styles.row}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  router.push(`/recruiter/candidates/${interview.application_id}`)
                                }
                                onKeyDown={(event) => handleRowKeyDown(event, interview.id)}
                              >
                                <div className={styles.candidateCell}>
                                  <div
                                    className="cell-user__avatar cell-user__avatar--sm"
                                    style={
                                      {
                                        '--avatar-bg': `${accent}1A`,
                                        '--avatar-color': accent,
                                        backgroundImage: avatarUrl
                                          ? `url(${avatarUrl})`
                                          : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                      } as CSSProperties
                                    }
                                  >
                                    {!avatarUrl ? getInitials(interview.candidate_name) : null}
                                  </div>
                                  <div className={styles.candidateCopy}>
                                    <div className={styles.candidateHeading}>
                                      <span className={styles.candidateName}>
                                        {interview.candidate_name}
                                      </span>
                                      <span className={styles.tooltip}>
                                        <span
                                          className={styles.tooltipTrigger}
                                          aria-label={`Booking ref ${interview.cal_booking_uid}`}
                                        >
                                          <Hash size={12} aria-hidden="true" />
                                        </span>
                                        <span className={styles.tooltipContent} role="tooltip">
                                          Booking ref
                                          <strong>{interview.cal_booking_uid}</strong>
                                        </span>
                                      </span>
                                    </div>
                                    <span className={styles.candidateMeta}>
                                      <Mail size={12} aria-hidden="true" />
                                      {interview.candidate_email}
                                    </span>
                                  </div>
                                  <div className={styles.timeCell}>
                                    <span className={styles.rowEyebrow}>Schedule</span>
                                    <span className={styles.rowPrimary}>
                                      {formatDateTimeLine(interview)}
                                    </span>
                                    <div className={styles.inlineMeta}>
                                      <span className={styles.metaItem}>
                                        <MapPin size={12} aria-hidden="true" />
                                        {getLocationLabel(interview.location)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.detailsCell}>
                                  <div className={styles.roleCell}>
                                    <span className={styles.rowEyebrow}>Job</span>
                                    <Link
                                      href={`/recruiter/jobs/${interview.job_id}`}
                                      className={styles.roleLink}
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      {interview.job_title}
                                    </Link>
                                  </div>

                                  <div className={styles.statusCell}>
                                    <span className={styles.rowEyebrow}>Status</span>
                                    <StatusPill
                                      kind="application"
                                      status={interview.application_status}
                                    />
                                  </div>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      ) : null}
                    </section>
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
