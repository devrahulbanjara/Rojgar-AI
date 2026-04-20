'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import { useGetMyInterviewsQuery } from '@/store/services/interviewsApi'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'

import DashboardErrorState from '@/components/common/DashboardErrorState'
import StatusPill from '@/components/common/StatusPill'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string, timezone: string | null): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: timezone ? undefined : 'short',
  })
}

function InterviewSkeleton() {
  return (
    <div className="dash-card">
      <div className="dash-card__body">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="recruiter-candidate-detail__block"
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              padding: '0.75rem 0',
              borderBottom: 'var(--border-subtle) solid 1px',
            }}
          >
            <div
              className="skeleton-block"
              style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div
                className="skeleton-block"
                style={{ height: 16, width: '55%', borderRadius: 4 }}
              />
              <div
                className="skeleton-block"
                style={{ height: 13, width: '35%', borderRadius: 4 }}
              />
              <div
                className="skeleton-block"
                style={{ height: 13, width: '45%', borderRadius: 4 }}
              />
            </div>
            <div
              className="skeleton-block"
              style={{ width: 90, height: 24, borderRadius: 'var(--radius-pill)' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CandidateInterviewsPage() {
  const { data, isLoading, isError, error, isFetching, refetch } = useGetMyInterviewsQuery()
  const interviews = useMemo(() => data?.data ?? [], [data?.data])
  // Capture page-load time once via lazy initializer — Date.now reference, not a call
  const [now] = useState(Date.now)

  const upcoming = useMemo(
    () => interviews.filter((i) => new Date(i.start_time).getTime() >= now),
    [interviews, now],
  )
  const past = useMemo(
    () => interviews.filter((i) => new Date(i.start_time).getTime() < now),
    [interviews, now],
  )

  if (isError) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h1 className="dash-page-header__title">My Interviews</h1>
            <p className="dash-page-header__subtitle">All scheduled and past interviews.</p>
          </div>
        </div>
        <DashboardErrorState error={error} isRetrying={isFetching} onRetry={() => void refetch()} />
      </div>
    )
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h1 className="dash-page-header__title">My Interviews</h1>
          <p className="dash-page-header__subtitle">All scheduled and past interviews.</p>
        </div>
        <div className="dash-page-header__actions">
          <span className="page-header-hint">
            {isLoading
              ? 'Loading...'
              : `${interviews.length} interview${interviews.length === 1 ? '' : 's'} total`}
          </span>
        </div>
      </div>

      {isLoading ? (
        <InterviewSkeleton />
      ) : interviews.length === 0 ? (
        <div className="dash-card">
          <div className="dash-card__body">
            <div className="apps-empty">
              <CalendarDays size={40} aria-hidden="true" />
              <p>No interviews scheduled yet.</p>
              <Link href="/candidate/applications" className="btn btn--primary btn--sm">
                View applications
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Upcoming</div>
                  <div className="dash-card__subtitle">
                    {upcoming.length} upcoming interview{upcoming.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className="dash-card__body">
                <div className="activity-list activity-list--panel">
                  {upcoming.map((interview) => (
                    <div
                      key={interview.id}
                      className="recruiter-candidate-detail__block"
                      style={{ paddingBottom: '1rem' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          <div
                            className="recruiter-candidate-detail__label"
                            style={{ marginBottom: '0.25rem' }}
                          >
                            {interview.title ?? interview.job_title}
                          </div>
                          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                            {interview.job_title}
                          </p>
                          <p className="cell-muted">{interview.company_name}</p>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                              marginTop: '0.4rem',
                            }}
                          >
                            <span className="recruiter-candidate-detail__contactValue">
                              <CalendarDays size={12} />
                              {formatDate(interview.start_time)}
                            </span>
                            <span className="recruiter-candidate-detail__contactValue">
                              <Clock3 size={12} />
                              {formatTime(interview.start_time, interview.timezone)} –{' '}
                              {formatTime(interview.end_time, interview.timezone)}
                            </span>
                            {interview.location ? (
                              <span className="recruiter-candidate-detail__contactValue">
                                <MapPin size={12} />
                                {interview.location}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div
                          style={{
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '0.5rem',
                          }}
                        >
                          <StatusPill kind="application" status={interview.application_status} />
                          <Link
                            href={`/candidate/applications/${interview.application_id}`}
                            className="btn btn--outline btn--primary btn--sm"
                          >
                            View Application
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Past</div>
                  <div className="dash-card__subtitle">
                    {past.length} past interview{past.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className="dash-card__body">
                <div className="activity-list activity-list--panel">
                  {past.map((interview) => (
                    <div
                      key={interview.id}
                      className="recruiter-candidate-detail__block"
                      style={{ paddingBottom: '1rem', opacity: 0.8 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          <div
                            className="recruiter-candidate-detail__label"
                            style={{ marginBottom: '0.25rem' }}
                          >
                            {interview.title ?? interview.job_title}
                          </div>
                          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                            {interview.job_title}
                          </p>
                          <p className="cell-muted">{interview.company_name}</p>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                              marginTop: '0.4rem',
                            }}
                          >
                            <span className="recruiter-candidate-detail__contactValue">
                              <CalendarDays size={12} />
                              {formatDate(interview.start_time)}
                            </span>
                            <span className="recruiter-candidate-detail__contactValue">
                              <Clock3 size={12} />
                              {formatTime(interview.start_time, interview.timezone)} –{' '}
                              {formatTime(interview.end_time, interview.timezone)}
                            </span>
                            {interview.location ? (
                              <span className="recruiter-candidate-detail__contactValue">
                                <MapPin size={12} />
                                {interview.location}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div
                          style={{
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '0.5rem',
                          }}
                        >
                          <StatusPill kind="application" status={interview.application_status} />
                          <Link
                            href={`/candidate/applications/${interview.application_id}`}
                            className="btn btn--outline btn--primary btn--sm"
                          >
                            View Application
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
