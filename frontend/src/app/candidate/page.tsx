'use client'

import type { CSSProperties } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'

import { useAppSelector } from '@/store/hooks'
import { useGetCandidateDashboardQuery } from '@/store/services/dashboardApi'
import { useUpdateMyProfileMutation } from '@/store/services/profileApi'
import { Calendar, ChevronRight } from 'lucide-react'

import MediaBadge from '@/components/common/MediaBadge'
import StatusPill from '@/components/common/StatusPill'

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

function getCompanyAccent(name: string): { logo: string; color: string } {
  const palette = ['#0f766e', '#2563eb', '#dc2626', '#9333ea', '#d97706', '#0891b2']
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return {
    logo: name.trim().charAt(0).toUpperCase() || 'C',
    color: palette[seed % palette.length],
  }
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

  if (status === 'screening') return `Applied ${createdLabel} · Under review`
  if (status === 'shortlisted') return `Applied ${createdLabel} · Shortlisted`
  if (status === 'interview_booked') return `Applied ${createdLabel} · Interview booked`
  if (status === 'interview_completed') return `Applied ${createdLabel} · Interview completed`
  if (status === 'offer') return `Applied ${createdLabel} · Offer received`
  if (status === 'rejected') return `Applied ${createdLabel} · Not progressed`
  return `Applied ${createdLabel}`
}

const PIPELINE_LEGEND = [
  { label: 'Completed', tone: 'done' },
  { label: 'Current stage', tone: 'active' },
  { label: 'Upcoming', tone: 'pending' },
] as const

function CandidateDashboardSkeleton() {
  return (
    <div className="candidate-dashboard">
      <div className="dash-stats candidate-dashboard__stats-grid">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="stat-card" aria-hidden="true">
            <div className="skeleton-block stat-card__value-skeleton" />
            <div className="skeleton-block dashboard-card-skeleton__meta" />
          </div>
        ))}
      </div>
      <div className="dash-card">
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
    </div>
  )
}

export default function UserDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const {
    data: dashboardResponse,
    isLoading,
    isError,
    refetch: refetchDashboard,
  } = useGetCandidateDashboardQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation()
  const dashboardData = dashboardResponse?.data

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
                    Open to Work {dashboardData?.is_open_to_work ? '· Active' : '· Off'}
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

          <p className="dash-page-header__subtitle">
            {isLoading ? (
              <div
                className="skeleton-block"
                style={{ width: '200px', height: '14px', marginTop: '4px' }}
              />
            ) : dashboardData?.urgent_action ? (
              'You have 1 action waiting on you.'
            ) : (
              'Track every application and take the next step quickly.'
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <CandidateDashboardSkeleton />
      ) : isError || !dashboardData ? (
        <div className="dash-card">
          <div className="dash-card__body">
            Dashboard data is unavailable right now. Please refresh.
          </div>
        </div>
      ) : (
        <div className="candidate-dashboard">
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

          {dashboardData.urgent_action ? (
            <div className="candidate-dashboard__alert">
              <div className="candidate-dashboard__alert-dot" />
              <div className="candidate-dashboard__alert-copy">{dashboardData.urgent_action}</div>
              <Link href="/candidate/applications" className="btn btn--outline btn--sm">
                Book interview
              </Link>
            </div>
          ) : null}

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
                <div className="profile-empty">No applications yet. Start exploring jobs.</div>
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
                              '--logo-bg': `${accent.color}1A`,
                              '--logo-color': accent.color,
                            } as CSSProperties
                          }
                        />
                        <div className="candidate-pipeline-card__content">
                          <div className="candidate-pipeline-card__title">
                            {application.job_title}
                          </div>
                          <div className="candidate-pipeline-card__company">
                            {application.company_name} ·{' '}
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
                        {application.has_pending_action ? (
                          <span className="candidate-pipeline-card__action">
                            Book interview
                            <ChevronRight size={14} aria-hidden="true" />
                          </span>
                        ) : application.status === 'interview_booked' ? (
                          <span className="candidate-pipeline-card__action candidate-pipeline-card__action--muted">
                            <Calendar size={13} aria-hidden="true" />
                            Interview booked
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
