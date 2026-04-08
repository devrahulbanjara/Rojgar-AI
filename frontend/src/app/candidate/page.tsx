'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'

import { getCompanyAccent } from '@/lib/companyAccent'
import { calculateProfileCompletionPercentage } from '@/lib/profileCompletion'
import { useAppSelector } from '@/store/hooks'
import {
  useGetCandidateDashboardAnalyticsQuery,
  useGetCandidateDashboardQuery,
} from '@/store/services/dashboardApi'
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from '@/store/services/profileApi'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'

import DashboardErrorState from '@/components/common/DashboardErrorState'
import MediaBadge from '@/components/common/MediaBadge'
import StatusPill from '@/components/common/StatusPill'

import CandidateDashboardInsights from './_components/CandidateDashboardInsights'

type CandidateDashboardStatus =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'interview_booked'
  | 'interview_completed'
  | 'offer'
  | 'rejected'

function getFirstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? 'there'
}

function buildTimeline(status: CandidateDashboardStatus): string[] {
  if (status === 'rejected') {
    return ['done', 'rejected', 'pending', 'pending', 'pending']
  }

  const activeStep =
    status === 'applied'
      ? 1
      : status === 'screening'
        ? 2
        : status === 'shortlisted'
          ? 3
          : status === 'interview_booked' || status === 'interview_completed'
            ? 4
            : 5

  return Array.from({ length: 5 }, (_, index) => {
    const step = index + 1
    if (step < activeStep) return 'done'
    if (step === activeStep) return 'active'
    return 'pending'
  })
}

function formatApplicationMeta(createdAt: string, status: CandidateDashboardStatus): string {
  const createdLabel = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  if (status === 'screening') return `Applied ${createdLabel} | Under review`
  if (status === 'shortlisted') return `Applied ${createdLabel} | Shortlisted`
  if (status === 'interview_booked') return `Applied ${createdLabel} | Interview booked`
  if (status === 'interview_completed') return `Applied ${createdLabel} | Interview completed`
  if (status === 'offer') return `Applied ${createdLabel} | Offer received`
  if (status === 'rejected') return `Applied ${createdLabel} | Not progressed`
  return `Applied ${createdLabel}`
}

function formatInterviewDateLine(startTime: string): string {
  return new Date(startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatInterviewTimeLine(startTime: string, endTime: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${formatter.format(new Date(startTime))} - ${formatter.format(new Date(endTime))}`
}

const PIPELINE_LEGEND = [
  { label: 'Completed', tone: 'done' },
  { label: 'Current stage', tone: 'active' },
  { label: 'Upcoming', tone: 'pending' },
] as const

function CandidateDashboardSkeleton() {
  return (
    <div className="candidate-dashboard">
      <CandidateDashboardInsights
        analytics={undefined}
        isLoading={true}
        rangeKey="30d"
        onRangeChange={() => {}}
        readiness={{
          completion: 0,
          targetRoles: 0,
          skills: 0,
          isOpenToWork: false,
        }}
      />

      <div className="dash-stats candidate-dashboard__stats-grid">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="stat-card" aria-hidden="true">
            <div className="skeleton-block stat-card__value-skeleton" />
            <div className="skeleton-block dashboard-card-skeleton__meta" />
          </div>
        ))}
      </div>

      <div className="dash-card" aria-hidden="true">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Your applications</div>
            <div className="dash-card__subtitle">Know exactly where each application stands.</div>
          </div>
        </div>
        <div className="dash-card__body candidate-dashboard__list">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="candidate-pipeline-card" aria-hidden="true">
              <div className="candidate-pipeline-card__identity">
                <div className="skeleton-block candidate-pipeline-card__avatar-skeleton" />
                <div className="candidate-pipeline-card__content">
                  <div className="skeleton-block candidate-pipeline-card__title-skeleton" />
                  <div className="skeleton-block candidate-pipeline-card__meta-skeleton" />
                  <div className="candidate-pipeline-card__timeline">
                    {Array.from({ length: 5 }).map((__, segmentIndex) => (
                      <div
                        key={segmentIndex}
                        className="skeleton-block candidate-pipeline-card__timeline-skeleton"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="skeleton-block candidate-pipeline-card__badge-skeleton" />
            </div>
          ))}
        </div>
      </div>

      <div className="dash-card" aria-hidden="true">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Your interviews</div>
            <div className="dash-card__subtitle">
              Keep your booked interviews in view with time and location at a glance.
            </div>
          </div>
        </div>
        <div className="dash-card__body candidate-dashboard__list">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="candidate-interview-card" aria-hidden="true">
              <div className="candidate-interview-card__left">
                <div className="skeleton-block candidate-pipeline-card__avatar-skeleton" />
                <div className="candidate-interview-card__copy">
                  <div className="skeleton-block candidate-pipeline-card__title-skeleton" />
                  <div className="skeleton-block candidate-pipeline-card__meta-skeleton" />
                  <div className="skeleton-block candidate-pipeline-card__meta-skeleton" />
                </div>
              </div>
              <div className="skeleton-block candidate-pipeline-card__badge-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function UserDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const [analyticsRangeKey, setAnalyticsRangeKey] = useState<'7d' | '30d' | '90d'>('30d')
  const {
    data: dashboardResponse,
    isLoading,
    isError,
    isFetching,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetCandidateDashboardQuery()
  const {
    data: analyticsResponse,
    isLoading: isAnalyticsLoading,
    isFetching: isFetchingAnalytics,
    refetch: refetchAnalytics,
  } = useGetCandidateDashboardAnalyticsQuery(analyticsRangeKey)
  const {
    data: profileResponse,
    isFetching: isFetchingProfile,
    refetch: refetchProfile,
  } = useGetMyProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation()
  const dashboardData = dashboardResponse?.data
  const analyticsData = analyticsResponse?.data
  const profile = profileResponse?.data
  const interviews = useMemo(() => dashboardData?.interviews ?? [], [dashboardData?.interviews])
  const profileCompletion = useMemo(
    () => calculateProfileCompletionPercentage(profile ?? null),
    [profile],
  )

  const handleToggleOpenToWork = async () => {
    if (!dashboardData || isUpdating) return

    try {
      const newStatus = !dashboardData.is_open_to_work
      await updateProfile({ is_open_to_work: newStatus }).unwrap()
      toast.success(newStatus ? "You're now 'Open to Work'!" : 'Open to Work disabled.')
      refetchDashboard()
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const handleRetryDashboard = async () => {
    await Promise.allSettled([refetchDashboard(), refetchAnalytics(), refetchProfile()])
  }

  const firstName = getFirstName(user?.full_name ?? dashboardData?.user_name)

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <div className="dash-page-header__title-row">
            {isLoading && !user ? (
              <div className="skeleton-block" style={{ width: '240px', height: '36px' }} />
            ) : (
              <h1 className="dash-page-header__title">Good morning, {firstName}</h1>
            )}

            <div className="dash-page-header__status-inline">
              {isLoading ? (
                <div className="skeleton-block" style={{ width: '100px', height: '16px' }} />
              ) : (
                <div className="open-to-work-status open-to-work-status--header">
                  <span
                    className={`open-to-work-status__dot ${dashboardData?.is_open_to_work ? 'open-to-work-status__dot--active' : ''}`}
                  />
                  <span className="open-to-work-status__text">
                    Open to Work {dashboardData?.is_open_to_work ? '| Active' : '| Off'}
                  </span>
                  <button
                    className={`open-to-work-status__toggle ${isUpdating ? 'open-to-work-status__toggle--loading' : ''}`}
                    onClick={handleToggleOpenToWork}
                    disabled={isUpdating}
                  >
                    [{dashboardData?.is_open_to_work ? 'Turn off' : 'Turn on'}]
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="dash-page-header__subtitle">
            {isLoading ? (
              <div
                className="skeleton-block"
                style={{ width: '200px', height: '14px', marginTop: '4px' }}
              />
            ) : (
              'Track every application and take the next step quickly.'
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <CandidateDashboardSkeleton />
      ) : isError || !dashboardData ? (
        <DashboardErrorState
          error={dashboardError}
          isRetrying={isFetching || isFetchingAnalytics || isFetchingProfile}
          onRetry={handleRetryDashboard}
        />
      ) : (
        <div className="candidate-dashboard">
          <CandidateDashboardInsights
            analytics={analyticsData}
            isLoading={isAnalyticsLoading}
            rangeKey={analyticsRangeKey}
            onRangeChange={setAnalyticsRangeKey}
            readiness={{
              completion: profileCompletion,
              targetRoles: profile?.target_roles.length ?? 0,
              skills: profile?.skills.length ?? 0,
              isOpenToWork: dashboardData.is_open_to_work,
            }}
          />

          <div className="dash-stats candidate-dashboard__stats candidate-dashboard__stats-grid">
            <div className="stat-card">
              <div className="stat-card__value">{dashboardData.stats.total_applications}</div>
              <div className="stat-card__label">Applications</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value candidate-dashboard__stat-value--warning">
                {dashboardData.stats.shortlisted}
              </div>
              <div className="stat-card__label">Shortlisted</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{dashboardData.stats.interviews_booked}</div>
              <div className="stat-card__label">Interviews</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{dashboardData.stats.offers}</div>
              <div className="stat-card__label">Offers</div>
            </div>
            <div className="stat-card">
              <div
                className={`stat-card__value${dashboardData.stats.rejected > 0 ? ' candidate-dashboard__stat-value--danger' : ''}`}
              >
                {dashboardData.stats.rejected}
              </div>
              <div className="stat-card__label">Rejected</div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Your applications</div>
                <div className="dash-card__subtitle">
                  Know exactly where each application stands.
                </div>
              </div>
              <Link href="/candidate/applications" className="btn btn--outline btn--sm">
                View all
              </Link>
            </div>

            <div className="candidate-dashboard__legend">
              {PIPELINE_LEGEND.map((item) => (
                <span key={item.label} className="candidate-dashboard__legend-item">
                  <span
                    className={`candidate-dashboard__legend-dot candidate-dashboard__legend-dot--${item.tone}`}
                  />
                  {item.label}
                </span>
              ))}
            </div>

            <div className="dash-card__body candidate-dashboard__list">
              {dashboardData.applications.length === 0 ? (
                <div className="profile-empty">
                  No applications yet. <Link href="/candidate/jobs">Browse jobs</Link>
                </div>
              ) : (
                dashboardData.applications.map((application) => {
                  const accent = getCompanyAccent(application.company_name)
                  const timeline = buildTimeline(application.status)

                  return (
                    <Link
                      key={application.id}
                      href={`/candidate/applications?application=${application.id}`}
                      className="candidate-pipeline-card"
                    >
                      <div className="candidate-pipeline-card__identity">
                        <MediaBadge
                          src={application.company_logo_url}
                          alt={application.company_name}
                          fallback={accent.logo}
                          className="candidate-pipeline-card__avatar"
                          sizes="36px"
                          style={
                            {
                              '--logo-bg': accent.background,
                              '--logo-color': accent.color,
                            } as CSSProperties
                          }
                        />
                        <div className="candidate-pipeline-card__content">
                          <div className="candidate-pipeline-card__title">
                            {application.job_title}
                          </div>
                          <div className="candidate-pipeline-card__company">
                            {application.company_name} |{' '}
                            {application.location ?? application.location_type}
                          </div>
                          <div className="candidate-pipeline-card__timeline">
                            {timeline.map((segment, index) => (
                              <span
                                key={`${application.id}-${index}`}
                                className={`candidate-pipeline-card__segment candidate-pipeline-card__segment--${segment}`}
                              />
                            ))}
                          </div>
                          <div className="candidate-pipeline-card__meta">
                            {formatApplicationMeta(application.created_at, application.status)}
                          </div>
                        </div>
                      </div>

                      <div className="candidate-pipeline-card__aside">
                        <StatusPill kind="application" status={application.status} />
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {interviews.length > 0 ? (
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Your interviews</div>
                  <div className="dash-card__subtitle">
                    Keep your booked interviews in view with time and location at a glance.
                  </div>
                </div>
                <Link href="/candidate/applications" className="btn btn--outline btn--sm">
                  View applications
                </Link>
              </div>

              <div className="dash-card__body candidate-dashboard__list">
                {interviews.map((interview) => {
                  const accent = getCompanyAccent(interview.company_name)

                  return (
                    <Link
                      key={interview.interview_id}
                      href={`/candidate/applications?application=${interview.application_id}`}
                      className="candidate-interview-card"
                    >
                      <div className="candidate-interview-card__left">
                        <MediaBadge
                          src={interview.company_logo_url}
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
                            {interview.job_title}
                          </div>
                          <div className="candidate-interview-card__company">
                            {interview.company_name}
                          </div>
                          <div className="candidate-interview-card__schedule">
                            <span className="candidate-interview-card__metaItem">
                              <CalendarDays size={13} aria-hidden="true" />
                              {formatInterviewDateLine(interview.start_time)}
                            </span>
                            <span className="candidate-interview-card__metaItem">
                              <Clock3 size={13} aria-hidden="true" />
                              {formatInterviewTimeLine(interview.start_time, interview.end_time)}
                            </span>
                            <span className="candidate-interview-card__metaItem">
                              <MapPin size={13} aria-hidden="true" />
                              {interview.location?.trim() || 'Location TBD'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="candidate-interview-card__aside">
                        <StatusPill kind="application" status={interview.application_status} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
