'use client'

import { type CSSProperties, useMemo, useState } from 'react'

import Link from 'next/link'

import { getCompanyAccent } from '@/lib/companyAccent'
import {
  type CandidateInterviewView,
  useGetMyInterviewsQuery,
} from '@/store/services/interviewsApi'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'

import DashboardErrorState from '@/components/common/DashboardErrorState'
import MediaBadge from '@/components/common/MediaBadge'
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

function InterviewCardSkeleton() {
  return (
    <div className="candidate-interview-card">
      <div className="candidate-interview-card__left">
        <div
          className="skeleton-block"
          style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }}
        />
        <div className="candidate-interview-card__copy" style={{ gap: '0.4rem' }}>
          <div className="skeleton-block" style={{ height: 14, width: '50%', borderRadius: 4 }} />
          <div className="skeleton-block" style={{ height: 12, width: '30%', borderRadius: 4 }} />
          <div className="skeleton-block" style={{ height: 12, width: '65%', borderRadius: 4 }} />
        </div>
      </div>
      <div
        className="skeleton-block"
        style={{ width: 90, height: 24, borderRadius: 'var(--radius-pill)', flexShrink: 0 }}
      />
    </div>
  )
}

function InterviewSkeleton() {
  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div>
          <div className="skeleton-block" style={{ height: 16, width: 100, borderRadius: 4 }} />
          <div
            className="skeleton-block"
            style={{ height: 12, width: 140, borderRadius: 4, marginTop: 6 }}
          />
        </div>
      </div>
      <div className="dash-card__body candidate-dashboard__list">
        {Array.from({ length: 3 }).map((_, i) => (
          <InterviewCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function InterviewCard({
  interview,
  muted,
  index,
}: {
  interview: CandidateInterviewView
  muted?: boolean
  index: number
}) {
  const accent = getCompanyAccent(interview.company_name)

  return (
    <div
      className="candidate-interview-card content-stagger-item"
      style={{ '--stagger-index': index, opacity: muted ? 0.72 : 1 } as CSSProperties}
    >
      <div className="candidate-interview-card__left">
        <MediaBadge
          src={null}
          alt={interview.company_name}
          fallback={accent.logo}
          className="candidate-interview-card__avatar"
          sizes="40px"
          style={
            {
              '--logo-bg': accent.background,
              '--logo-color': accent.color,
            } as CSSProperties
          }
        />
        <div className="candidate-interview-card__copy">
          <div className="candidate-interview-card__title">
            {interview.title ?? interview.job_title}
          </div>
          <div className="candidate-interview-card__company">{interview.company_name}</div>
          <div className="candidate-interview-card__schedule">
            <span className="candidate-interview-card__metaItem">
              <CalendarDays size={12} aria-hidden="true" />
              {formatDate(interview.start_time)}
            </span>
            <span className="candidate-interview-card__metaItem">
              <Clock3 size={12} aria-hidden="true" />
              {formatTime(interview.start_time, interview.timezone)} &ndash;{' '}
              {formatTime(interview.end_time, interview.timezone)}
            </span>
            {interview.location ? (
              <span className="candidate-interview-card__metaItem">
                <MapPin size={12} aria-hidden="true" />
                {interview.location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="candidate-interview-card__aside"
        style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}
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
  )
}

export default function CandidateInterviewsPage() {
  const { data, isLoading, isError, error, isFetching, refetch } = useGetMyInterviewsQuery()
  const interviews = useMemo(() => data?.data ?? [], [data?.data])
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
        <div
          className="content-stagger"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
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
              <div className="dash-card__body candidate-dashboard__list">
                {upcoming.map((interview, index) => (
                  <InterviewCard key={interview.id} interview={interview} index={index} />
                ))}
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
              <div className="dash-card__body candidate-dashboard__list">
                {past.map((interview, index) => (
                  <InterviewCard key={interview.id} interview={interview} muted index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
