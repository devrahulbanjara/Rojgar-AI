'use client'

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import {
  PROFILE_COMPLETION_FIELDS,
  PROFILE_COMPLETION_LABEL,
  getProfileCompletionMeta,
} from '@/lib/profileCompletion'
import { useAppSelector } from '@/store/hooks'
import {
  type CandidateDashboardRecommendedJob,
  useGetCandidateDashboardQuery,
} from '@/store/services/dashboardApi'
import { Banknote, BriefcaseBusiness, Calendar, FileStack, FileText } from 'lucide-react'

type StatVariant = 'primary' | 'success' | 'secondary' | 'warning'
type StatIconName = 'applications' | 'calendar' | 'offers' | 'resumes'

type DashboardStat = {
  label: string
  value: string | null
  icon: StatIconName
  variant: StatVariant
}

const DASHBOARD_STAT_CONFIG: Omit<DashboardStat, 'value'>[] = [
  {
    label: 'Total Applications',
    icon: 'applications',
    variant: 'primary',
  },
  {
    label: 'Active Interviews',
    icon: 'calendar',
    variant: 'success',
  },
  {
    label: 'Offers Received',
    icon: 'offers',
    variant: 'secondary',
  },
  {
    label: 'Resume Versions',
    icon: 'resumes',
    variant: 'warning',
  },
]

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return 'CP'

  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'CP'
}

function getStrengthColor(ratio: number): string {
  const stops = [
    { ratio: 0, hue: 2 },
    { ratio: 0.34, hue: 24 },
    { ratio: 0.68, hue: 48 },
    { ratio: 1, hue: 146 },
  ]

  const clampedRatio = Math.max(0, Math.min(1, ratio))
  const upperIndex = stops.findIndex((stop) => stop.ratio >= clampedRatio)

  if (upperIndex <= 0) {
    return `hsl(${stops[0].hue} 88% 58%)`
  }

  if (upperIndex === -1) {
    return `hsl(${stops[stops.length - 1].hue} 72% 42%)`
  }

  const lower = stops[upperIndex - 1]
  const upper = stops[upperIndex]
  const range = upper.ratio - lower.ratio || 1
  const progress = (clampedRatio - lower.ratio) / range
  const hue = lower.hue + (upper.hue - lower.hue) * progress

  return `hsl(${hue} 82% 52%)`
}

function ApplicationStatusIcon({ variant }: { variant: string }) {
  const colors: Record<string, string> = {
    success: '#0cce6b',
    warning: '#f59e0b',
    primary: '#0070f3',
    gray: '#9ca3af',
    danger: '#ff4d4d',
  }

  return (
    <div
      className="app-status-dot"
      style={{ '--dot-color': colors[variant] || colors.gray } as CSSProperties}
    />
  )
}

function StatIcon({ icon }: { icon: StatIconName }) {
  const icons: Record<StatIconName, ReactNode> = {
    applications: <FileText size={16} strokeWidth={1.75} />,
    calendar: <Calendar size={16} strokeWidth={1.75} />,
    offers: <BriefcaseBusiness size={16} strokeWidth={1.75} />,
    resumes: <FileStack size={16} strokeWidth={1.75} />,
  }

  return icons[icon]
}

function formatRelativeDate(iso: string): string {
  const timestamp = new Date(iso).getTime()
  const diffMs = Date.now() - timestamp
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)))
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour))
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(diffMs / day)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusLabel(status: string): string {
  return status
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function getStatusVariant(status: string): string {
  switch (status) {
    case 'interview':
    case 'offered':
    case 'hired':
      return 'success'
    case 'screening':
      return 'warning'
    case 'rejected':
    case 'withdrawn':
      return 'danger'
    default:
      return 'primary'
  }
}

function getCompanyAccent(name: string): { logo: string; color: string } {
  const palette = ['#0f766e', '#2563eb', '#dc2626', '#9333ea', '#d97706', '#0891b2']
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return {
    logo: name.trim().charAt(0).toUpperCase() || 'C',
    color: palette[seed % palette.length],
  }
}

function formatSalaryRange(job: CandidateDashboardRecommendedJob): string {
  if (job.salary_min == null && job.salary_max == null) return 'Salary not specified'
  if (job.salary_min != null && job.salary_max != null) {
    return `${job.currency} ${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min != null) {
    return `${job.currency} ${job.salary_min.toLocaleString()}+`
  }
  return `Up to ${job.currency} ${job.salary_max!.toLocaleString()}`
}

function getRecommendedJobTags(job: CandidateDashboardRecommendedJob): string[] {
  return [job.category, job.location_type, job.company.industry]
    .filter((value): value is string => Boolean(value))
    .slice(0, 3)
}

function RecentApplicationsSkeletonRows({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, index) => (
    <tr key={index} aria-hidden="true">
      <td>
        <div className="cell-user">
          <div className="skeleton-block dashboard-table-skeleton__avatar" />
          <div className="skeleton-block dashboard-table-skeleton__text dashboard-table-skeleton__text--company" />
        </div>
      </td>
      <td>
        <div className="skeleton-block dashboard-table-skeleton__text dashboard-table-skeleton__text--role" />
      </td>
      <td>
        <div className="skeleton-block dashboard-table-skeleton__text dashboard-table-skeleton__text--location" />
      </td>
      <td>
        <div className="skeleton-block dashboard-table-skeleton__badge" />
      </td>
      <td>
        <div className="skeleton-block dashboard-table-skeleton__text dashboard-table-skeleton__text--date" />
      </td>
    </tr>
  ))
}

function RecommendedJobsSkeletonCards({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="job-card job-card--skeleton" aria-hidden="true">
      <div className="job-card__header">
        <div className="skeleton-block recommended-job-skeleton__logo" />
        <div className="job-card__title-wrap recommended-job-skeleton__title-wrap">
          <div className="skeleton-block recommended-job-skeleton__title" />
          <div className="skeleton-block recommended-job-skeleton__company" />
        </div>
      </div>

      <div className="job-card__tags">
        <div className="skeleton-block recommended-job-skeleton__tag" />
        <div className="skeleton-block recommended-job-skeleton__tag recommended-job-skeleton__tag--short" />
        <div className="skeleton-block recommended-job-skeleton__tag recommended-job-skeleton__tag--mid" />
      </div>

      <div className="job-card__meta recommended-job-skeleton__meta">
        <div className="skeleton-block recommended-job-skeleton__salary" />
        <div className="skeleton-block recommended-job-skeleton__button" />
      </div>
    </div>
  ))
}

function ProfileStrengthBanner({
  completionPercentage,
  initials,
  isLoading = false,
}: {
  completionPercentage: number
  initials: string
  isLoading?: boolean
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setAnimatedPercentage(completionPercentage)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [completionPercentage])

  const completionMeta = getProfileCompletionMeta(completionPercentage)
  const segmentCount = PROFILE_COMPLETION_FIELDS.length

  function getSegmentFill(index: number) {
    const raw = animatedPercentage - index * (100 / segmentCount)
    return Math.max(0, Math.min(100, raw * segmentCount))
  }

  function getSegmentGradient(index: number) {
    const startRatio = index / Math.max(segmentCount - 1, 1)
    const endRatio = (index + 1) / Math.max(segmentCount - 1, 1)

    return `linear-gradient(90deg, ${getStrengthColor(startRatio)}, ${getStrengthColor(Math.min(endRatio, 1))})`
  }

  return (
    <div className="stat-card profile-strength-banner">
      <div className="profile-strength-banner__identity">
        <div className="profile-strength-banner__avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="profile-strength-banner__copy">
          <div className="profile-strength-banner__label">{PROFILE_COMPLETION_LABEL}</div>
          {isLoading ? (
            <div className="skeleton-block profile-strength-banner__status-skeleton" />
          ) : (
            <div
              className={`profile-strength-banner__status profile-strength-banner__status--${completionMeta.tone} content-fade-in`}
            >
              {completionMeta.label}
            </div>
          )}
        </div>
      </div>

      <div
        className="profile-strength-banner__segments"
        aria-label={`${PROFILE_COMPLETION_LABEL} ${completionPercentage}%`}
        style={{ gridTemplateColumns: `repeat(${segmentCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: segmentCount }).map((_, index) => (
          <div key={index} className="profile-strength-banner__segment">
            {isLoading ? (
              <div className="skeleton-block profile-strength-banner__segment-skeleton" />
            ) : (
              <div
                className="profile-strength-banner__segment-fill content-fade-in"
                style={{
                  width: `${getSegmentFill(index)}%`,
                  backgroundImage: getSegmentGradient(index),
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="profile-strength-banner__actions">
        {isLoading ? (
          <div className="skeleton-block profile-strength-banner__percent-skeleton" />
        ) : (
          <div className="profile-strength-banner__percent content-fade-in">
            {completionPercentage}%
          </div>
        )}
        <Link href="/dashboard/profile" className="profile-strength-banner__link">
          Complete your profile →
        </Link>
      </div>
    </div>
  )
}

export default function UserDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const {
    data: dashboardResponse,
    isLoading: isStatsLoading,
    isError,
  } = useGetCandidateDashboardQuery()
  const dashboardData = dashboardResponse?.data
  const statsLoadError = isError ? 'Dashboard data is unavailable right now.' : null

  const firstName = useMemo(
    () =>
      user?.full_name?.trim().split(/\s+/)[0] ??
      dashboardData?.user_name?.trim().split(/\s+/)[0] ??
      'there',
    [dashboardData?.user_name, user],
  )
  const userInitials = useMemo(() => getInitials(user?.full_name), [user])

  const completionPercentage = dashboardData?.stats.profile_completion ?? 0
  const recommendedJobs = dashboardData?.recommended_jobs ?? []

  const stats = useMemo<DashboardStat[]>(() => {
    const summary = dashboardData?.stats

    return DASHBOARD_STAT_CONFIG.map((stat) => ({
      ...stat,
      value:
        summary == null
          ? null
          : stat.icon === 'applications'
            ? String(summary.total_applications)
            : stat.icon === 'calendar'
              ? String(summary.active_interviews)
              : stat.icon === 'offers'
                ? String(summary.offers_received)
                : String(summary.total_resumes),
    }))
  }, [dashboardData?.stats])

  return (
    <>
      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Welcome back, {firstName} 👋</h2>
            <p className="dash-page-header__subtitle">
              Here&apos;s what&apos;s happening with your job search today.
            </p>
          </div>
          <div className="dash-page-header__actions">
            <span className="page-header-hint">{statsLoadError ?? 'Last updated: just now'}</span>
          </div>
        </div>

        <div className="dashboard-overview-stack">
          <div className="dash-stats dash-stats--4col">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                {isStatsLoading ? (
                  <div className="skeleton-block stat-card__value-skeleton" aria-hidden="true" />
                ) : (
                  <div className="stat-card__value content-fade-in">{stat.value}</div>
                )}
                <div className="stat-card__footer">
                  <div className={`stat-card__icon-wrap stat-card__icon-wrap--${stat.variant}`}>
                    <StatIcon icon={stat.icon} />
                  </div>
                  <div className="stat-card__label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
          <ProfileStrengthBanner
            completionPercentage={completionPercentage}
            initials={userInitials}
            isLoading={isStatsLoading}
          />

          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Recent Applications</div>
                <div className="dash-card__subtitle">Your latest job applications</div>
              </div>
              <Link href="/dashboard/applications" className="btn btn--outline btn--sm">
                View All
              </Link>
            </div>
            <div className="table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {isStatsLoading
                    ? RecentApplicationsSkeletonRows({ count: 5 })
                    : (dashboardData?.recent_applications ?? []).map((app, index) => {
                        const accent = getCompanyAccent(app.company_name)
                        const variant = getStatusVariant(app.status)

                        return (
                          <tr
                            key={app.id}
                            className="content-stagger-item"
                            style={{ '--stagger-index': index } as CSSProperties}
                          >
                            <td>
                              <div className="cell-user">
                                <div
                                  className="cell-user__avatar cell-user__avatar--sm cell-user__avatar--rect"
                                  style={
                                    {
                                      '--avatar-bg': accent.color + '1A',
                                      '--avatar-color': accent.color,
                                    } as CSSProperties
                                  }
                                >
                                  {accent.logo}
                                </div>
                                {app.company_name}
                              </div>
                            </td>
                            <td className="cell-meta">{app.job_title}</td>
                            <td className="cell-muted">{app.location ?? app.location_type}</td>
                            <td>
                              <span className={`badge badge--${variant}`}>
                                <ApplicationStatusIcon variant={variant} />
                                {getStatusLabel(app.status)}
                              </span>
                            </td>
                            <td className="cell-muted">{formatRelativeDate(app.created_at)}</td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Recommended for You</div>
              <div className="dash-card__subtitle">Based on your profile and skills</div>
            </div>
            <Link href="/dashboard/jobs" className="btn btn--outline btn--sm">
              Browse All Jobs
            </Link>
          </div>
          <div className="dash-card__body">
            <div className="dash-grid dash-grid--3col">
              {isStatsLoading ? (
                RecommendedJobsSkeletonCards({ count: 3 })
              ) : recommendedJobs.length === 0 ? (
                <div className="profile-empty">No recommended jobs available yet.</div>
              ) : (
                recommendedJobs.map((job, index) => {
                  const accent = getCompanyAccent(job.company.name)
                  const tags = getRecommendedJobTags(job)

                  return (
                    <div
                      key={job.id}
                      className="job-card content-stagger-item"
                      style={{ '--stagger-index': index } as CSSProperties}
                    >
                      <div className="job-card__header">
                        <div
                          className="job-card__logo"
                          style={
                            {
                              '--logo-bg': accent.color + '1A',
                              '--logo-color': accent.color,
                            } as CSSProperties
                          }
                        >
                          {accent.logo}
                        </div>
                        <div className="job-card__title-wrap">
                          <div className="job-card__title">{job.title}</div>
                          <div className="job-card__company">
                            {job.company.name}
                            <span className="job-card__location">
                              · {job.location ?? job.location_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="job-card__tags">
                        {tags.map((tag) => (
                          <span key={tag} className="job-card__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="job-card__meta">
                        <span>
                          <Banknote size={12} aria-hidden="true" />
                          {formatSalaryRange(job)}
                        </span>
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="btn btn--primary btn--sm job-card__meta-time"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
