'use client'

import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'

import { getInitials } from '@/lib/mediaValidation'
import {
  type InterviewItem,
  useGetInterviewsQuery,
  useMarkInterviewCompleteMutation,
} from '@/store/services/interviewsApi'
import { useGetCompanyJobsQuery, useSetHiringCompletedMutation } from '@/store/services/jobsApi'
import { CalendarDays, Clock3, MapPin, Ticket } from 'lucide-react'

import ButtonSpinner from '@/components/common/ButtonSpinner'
import MediaBadge from '@/components/common/MediaBadge'
import StatusPill from '@/components/common/StatusPill'

import styles from './page.module.css'

type DatePreset = 'today' | 'week' | 'month' | 'custom'

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

function formatDayHeading(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

function formatTimeRange(interview: InterviewItem) {
  const start = new Date(interview.start_time)
  const end = new Date(interview.end_time)
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function getLocationLabel(value: string | null) {
  return value?.trim() || 'Location pending'
}

export default function RecruiterInterviewsPage() {
  const today = useMemo(() => new Date(), [])
  const [preset, setPreset] = useState<DatePreset>('week')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [customStart, setCustomStart] = useState(toInputDate(startOfWeek(today)))
  const [customEnd, setCustomEnd] = useState(toInputDate(endOfWeek(today)))

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
  const [markInterviewComplete, { isLoading: isMarkingInterviewComplete }] =
    useMarkInterviewCompleteMutation()

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
  const groupedInterviews = useMemo(() => {
    return interviews.reduce<Record<string, InterviewItem[]>>((accumulator, interview) => {
      const dayKey = new Date(interview.start_time).toISOString().slice(0, 10)
      accumulator[dayKey] = accumulator[dayKey] ?? []
      accumulator[dayKey].push(interview)
      return accumulator
    }, {})
  }, [interviews])

  const groupedEntries = Object.entries(groupedInterviews)

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

  async function handleMarkInterviewComplete(interviewId: string) {
    try {
      await markInterviewComplete(interviewId).unwrap()
      toast.success('Interview marked complete.')
      void refetch()
    } catch {
      toast.error('Could not mark this interview as complete.')
    }
  }

  const isLoading = isLoadingJobs || isLoadingInterviews

  return (
    <div className={`dash-content container container--app-shell ${styles.page}`}>
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Interviews</h2>
          <p className="dash-page-header__subtitle">
            Upcoming candidate interviews across all your jobs.
          </p>
        </div>
        <div className="dash-page-header__actions">
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

      <section className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          <div className={styles.presetGroup}>
            {[
              ['today', 'Today'],
              ['week', 'This week'],
              ['month', 'This month'],
              ['custom', 'Custom range'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`${styles.presetButton} ${preset === value ? styles.presetButtonActive : ''}`}
                onClick={() => setPreset(value as DatePreset)}
              >
                {label}
              </button>
            ))}
          </div>

          {preset === 'custom' ? (
            <div className={styles.customRange}>
              <label className={styles.dateField}>
                <span className={styles.fieldLabel}>Start</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                />
              </label>
              <label className={styles.dateField}>
                <span className={styles.fieldLabel}>End</span>
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

          <span className="badge badge--secondary">
            {isLoading
              ? 'Loading...'
              : `${interviews.length} interview${interviews.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </section>

      {isLoading ? (
        <section className={styles.contentCard}>
          <div className={styles.loadingBlock} />
          <div className={styles.loadingBlock} />
          <div className={styles.loadingBlock} />
        </section>
      ) : groupedEntries.length > 0 ? (
        <div className={styles.groups}>
          {groupedEntries.map(([day, items]) => (
            <section key={day} className={styles.daySection}>
              <div className={styles.dayHeading}>{formatDayHeading(day)}</div>
              <div className={styles.cardList}>
                {items.map((interview) => (
                  <article key={interview.id} className={styles.interviewCard}>
                    <div className={styles.cardTop}>
                      <div className={styles.candidateBlock}>
                        <MediaBadge
                          src={null}
                          alt={interview.candidate_name}
                          fallback={getInitials(interview.candidate_name)}
                          className={styles.avatar}
                          sizes="44px"
                        />
                        <div className={styles.candidateCopy}>
                          <div className={styles.candidateName}>{interview.candidate_name}</div>
                          <div className={styles.candidateEmail}>{interview.candidate_email}</div>
                        </div>
                      </div>
                      <Link
                        href={`/recruiter/jobs/${interview.job_id}/edit`}
                        className={styles.jobLink}
                      >
                        {interview.job_title}
                      </Link>
                    </div>

                    <div className={styles.cardMeta}>
                      <StatusPill
                        kind="application"
                        status={interview.application_status}
                        className={styles.referenceBadge}
                      />
                      <span className={styles.metaItem}>
                        <Clock3 size={14} aria-hidden="true" />
                        {formatTimeRange(interview)}
                        {interview.timezone ? ` (${interview.timezone})` : ''}
                      </span>
                      <span className={`badge badge--gray ${styles.locationBadge}`}>
                        <MapPin size={13} aria-hidden="true" />
                        {getLocationLabel(interview.location)}
                      </span>
                      <span className={`badge badge--secondary ${styles.referenceBadge}`}>
                        <Ticket size={13} aria-hidden="true" />
                        {interview.cal_booking_uid}
                      </span>
                      {interview.application_status === 'interview_booked' ? (
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          disabled={isMarkingInterviewComplete}
                          onClick={() => void handleMarkInterviewComplete(interview.id)}
                        >
                          {isMarkingInterviewComplete ? (
                            <ButtonSpinner label="Updating..." />
                          ) : (
                            'Mark complete'
                          )}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className={styles.emptyCard}>
          <div className={styles.emptyIcon}>
            <CalendarDays size={22} aria-hidden="true" />
          </div>
          {selectedJob?.hiring_completed ? (
            <>
              <span className="badge badge--success">Hiring complete</span>
              <div className={styles.emptyTitle}>This job is marked as hiring complete</div>
              <p className={styles.emptyText}>
                Interviews are hidden once hiring is completed for a role.
              </p>
            </>
          ) : (
            <>
              <div className={styles.emptyTitle}>No interviews scheduled</div>
              <p className={styles.emptyText}>
                Shortlist candidates in screening and send outreach emails to start booking
                interviews.
              </p>
              <div className={styles.emptyActions}>
                <Link href="/recruiter/outreach" className="btn btn--primary btn--sm">
                  Open outreach
                </Link>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
