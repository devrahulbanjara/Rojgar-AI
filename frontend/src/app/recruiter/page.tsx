'use client'

import { type CSSProperties } from 'react'

import Link from 'next/link'

import { useAppSelector } from '@/store/hooks'
import { useGetCompanyRecruitersQuery, useGetMyCompanyQuery } from '@/store/services/companyApi'
import type { RecruiterMember } from '@/store/services/companyApi'
import { type RecruiterDashboardJob, dashboardApi } from '@/store/services/dashboardApi'
import {
  Briefcase,
  BriefcaseBusiness,
  CalendarCheck,
  Clock,
  FileText,
  Settings2,
  UserCheck,
  Users,
} from 'lucide-react'

type IconKey = 'briefcase' | 'file-text' | 'calendar-check' | 'user-check' | 'users' | 'clock'
type DashboardStat = {
  label: string
  value: string | null
  trend: string
  trendDir: 'up' | 'down'
  variant: 'primary' | 'secondary' | 'success' | 'warning'
  icon: IconKey
}

function StatIcon({ icon }: { icon: IconKey }) {
  const icons: Record<IconKey, React.ReactNode> = {
    briefcase: <Briefcase size={16} strokeWidth={1.75} />,
    'file-text': <FileText size={16} strokeWidth={1.75} />,
    'calendar-check': <CalendarCheck size={16} strokeWidth={1.75} />,
    'user-check': <UserCheck size={16} strokeWidth={1.75} />,
    users: <Users size={16} strokeWidth={1.75} />,
    clock: <Clock size={16} strokeWidth={1.75} />,
  }
  return icons[icon] || null
}

const STAT_CONFIG: Omit<DashboardStat, 'value'>[] = [
  {
    label: 'Active Job Posts',
    trend: '+2',
    trendDir: 'up',
    variant: 'primary',
    icon: 'briefcase' as IconKey,
  },
  {
    label: 'Total Applications',
    trend: '+48',
    trendDir: 'up',
    variant: 'secondary',
    icon: 'file-text' as IconKey,
  },
  {
    label: 'Interviews Scheduled',
    trend: '+5',
    trendDir: 'up',
    variant: 'success',
    icon: 'calendar-check' as IconKey,
  },
  {
    label: 'Hires This Month',
    trend: '+2',
    trendDir: 'up',
    variant: 'warning',
    icon: 'user-check' as IconKey,
  },
]

function formatRelativeDate(value: string): string {
  const timestamp = new Date(value).getTime()
  const diffMs = Date.now() - timestamp
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour))
    return `${hours}h ago`
  }

  const days = Math.floor(diffMs / day)
  if (days < 7) return `${days}d ago`

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function RecruiterTopJobsSkeletonRows({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="item-row item-row--pad item-row--skeleton" aria-hidden="true">
      <div className="item-row__logo item-row__logo--icon">
        <div className="skeleton-block recruiter-jobs-skeleton__logo" />
      </div>
      <div className="item-row__info recruiter-jobs-skeleton__info">
        <div className="skeleton-block recruiter-jobs-skeleton__title" />
        <div className="skeleton-block recruiter-jobs-skeleton__sub" />
      </div>
      <div className="item-row__right recruiter-jobs-skeleton__right">
        <div className="skeleton-block recruiter-jobs-skeleton__status" />
        <div className="skeleton-block recruiter-jobs-skeleton__bar" />
      </div>
    </div>
  ))
}

export default function CompanyDashboardPage() {
  const { user } = useAppSelector((s) => s.auth)
  const isCompanyAdmin = user?.primary_role === 'recruiter_admin'
  const { data: companyResp } = useGetMyCompanyQuery(undefined, {
    skip: !isCompanyAdmin,
  })

  const { data: recruitersResp } = useGetCompanyRecruitersQuery(undefined, {
    skip: !isCompanyAdmin,
  })
  const { data: recruiterDashboardResp, isLoading: isRecruiterDashboardLoading } =
    dashboardApi.useGetRecruiterDashboardQuery()

  const company = companyResp?.data
  const companyName = company?.name ?? recruiterDashboardResp?.data.company_name ?? 'Your Company'
  const recruiters: RecruiterMember[] = recruitersResp?.data ?? []
  const activeRecruiters = recruiters.filter((r) => r.status === 'active')
  const pendingRecruiters = recruiters.filter((r) => r.status === 'pending')
  const topJobs: RecruiterDashboardJob[] = recruiterDashboardResp?.data.top_jobs ?? []
  const recruiterStats = recruiterDashboardResp?.data.stats
  const stats: DashboardStat[] = STAT_CONFIG.map((stat) => ({
    ...stat,
    value:
      recruiterStats == null
        ? null
        : stat.icon === 'briefcase'
          ? String(recruiterStats.active_job_posts)
          : stat.icon === 'file-text'
            ? String(recruiterStats.total_applications)
            : stat.label === 'Interviews Scheduled'
              ? '18'
              : '6',
  }))

  return (
    <>
      <div className="dash-content container container--app-shell">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Welcome, {companyName} ðŸ¢</h2>
            <p className="dash-page-header__subtitle">
              Manage your hiring pipeline and track performance.
            </p>
          </div>
        </div>

        <div className="dashboard-overview-stack">
          <div className="dash-grid dash-grid--2col">
            <Link href="/recruiter/screening" className="dash-card">
              <div className="dash-card__body">
                <div className="dash-card__title">Pending AI Reviews</div>
                <div className="stat-card__value">{recruiterStats?.pending_ai_reviews ?? 0}</div>
                <div className="dash-card__subtitle">
                  Applications waiting for recruiter review after screening
                </div>
              </div>
            </Link>
            <Link href="/recruiter/outreach" className="dash-card">
              <div className="dash-card__body">
                <div className="dash-card__title">Drafts To Send</div>
                <div className="stat-card__value">
                  {recruiterStats?.pending_email_drafts ?? 0}
                </div>
                <div className="dash-card__subtitle">
                  Candidate emails waiting for approval or send
                </div>
              </div>
            </Link>
          </div>

          <div className="dash-stats">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                {isRecruiterDashboardLoading ? (
                  <div className="skeleton-block stat-card__value-skeleton" aria-hidden="true" />
                ) : (
                  <div className="stat-card__value content-fade-in">{s.value ?? '0'}</div>
                )}
                <div className="stat-card__footer">
                  <div className={`stat-card__icon-wrap stat-card__icon-wrap--${s.variant}`}>
                    <StatIcon icon={s.icon} />
                  </div>
                  <div className="stat-card__label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dash-grid dash-grid--2col">
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Active Job Posts</div>
                  <div className="dash-card__subtitle">Top 7 active roles by applicant count</div>
                </div>
                <Link href="/recruiter/jobs" className="btn btn--outline btn--sm btn--icon-right">
                  Manage <Settings2 size={14} strokeWidth={2} />
                </Link>
              </div>
              <div className="dash-card__body dash-card__body--no-top">
                {isRecruiterDashboardLoading ? (
                  RecruiterTopJobsSkeletonRows({ count: 4 })
                ) : topJobs.length === 0 ? (
                  <div className="profile-empty">No active job posts available yet.</div>
                ) : (
                  topJobs.map((job) => (
                    <div key={job.id} className="item-row item-row--pad">
                      <div className="item-row__logo item-row__logo--icon">
                        <BriefcaseBusiness size={15} strokeWidth={1.75} />
                      </div>
                      <div className="item-row__info">
                        <div className="item-row__title">{job.title}</div>
                        <div className="item-row__sub">
                          {job.applications_count} applicant{job.applications_count === 1 ? '' : 's'}
                          {job.location ? ` Â· ${job.location}` : ''}
                        </div>
                      </div>
                      <div className="item-row__right">
                        <div
                          className="item-row__expires"
                          style={
                            {
                              '--expires-color': job.applications_count > 0 ? '#0070f3' : '#6b7280',
                            } as CSSProperties
                          }
                        >
                          <Clock size={12} strokeWidth={2} />
                          Posted {formatRelativeDate(job.created_at)}
                        </div>
                        <div className="progress-bar progress-bar--narrow-md">
                          <div
                            className="progress-bar__fill"
                            style={{ width: `${Math.min(job.applications_count, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Hiring Workflow</div>
                  <div className="dash-card__subtitle">
                    Move from AI review to candidate communication.
                  </div>
                </div>
              </div>
              <div className="dash-card__body recruiter-summary__body">
                <div className="cell-actions">
                  <Link href="/recruiter/screening" className="btn btn--primary btn--sm">
                    Review screening queue
                  </Link>
                  <Link href="/recruiter/outreach" className="btn btn--outline btn--sm">
                    Open outreach drafts
                  </Link>
                </div>
                <div className="cell-muted">
                  Use Screening to rank applicants and Outreach to prepare or send follow-ups.
                </div>
              </div>
            </div>
          </div>

          {isCompanyAdmin && (
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Your Recruiters</div>
                  <div className="dash-card__subtitle">
                    Team members posting jobs and screening candidates
                  </div>
                </div>
                <Link
                  href="/recruiter/recruiters"
                  className="btn btn--outline btn--sm btn--icon-right"
                >
                  Manage <Settings2 size={14} strokeWidth={2} />
                </Link>
              </div>
              <div className="dash-card__body recruiter-summary__body">
                <div className="recruiter-summary__grid">
                  <div className="stat-card stat-card--compact">
                    <div className="stat-card__value">{activeRecruiters.length}</div>
                    <div className="stat-card__footer">
                      <div className="stat-card__icon-wrap stat-card__icon-wrap--primary">
                        <StatIcon icon="users" />
                      </div>
                      <div className="stat-card__label">Active Recruiters</div>
                    </div>
                  </div>
                  <div className="stat-card stat-card--compact">
                    <div className="stat-card__value">{pendingRecruiters.length}</div>
                    <div className="stat-card__footer">
                      <div className="stat-card__icon-wrap stat-card__icon-wrap--warning">
                        <StatIcon icon="clock" />
                      </div>
                      <div className="stat-card__label">Pending Requests</div>
                    </div>
                  </div>
                </div>
                {pendingRecruiters.length > 0 && (
                  <Link
                    href="/recruiter/recruiters"
                    className="btn btn--warning btn--sm recruiter-summary__cta"
                  >
                    Review {pendingRecruiters.length} pending request
                    {pendingRecruiters.length > 1 ? 's' : ''}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
