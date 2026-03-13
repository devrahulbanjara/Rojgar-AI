'use client'

import { type CSSProperties } from 'react'

import Link from 'next/link'

import { useAppSelector } from '@/store/hooks'
import { useGetCompanyRecruitersQuery, useGetMyCompanyQuery } from '@/store/services/companyApi'
import type { RecruiterMember } from '@/store/services/companyApi'
import { type RecruiterDashboardJob, dashboardApi } from '@/store/services/dashboardApi'
import {
  ArrowRight,
  BrainCircuit,
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

const stats = [
  {
    label: 'Active Job Posts',
    value: '12',
    trend: '+2',
    trendDir: 'up',
    variant: 'primary',
    icon: 'briefcase' as IconKey,
  },
  {
    label: 'Total Applications',
    value: '342',
    trend: '+48',
    trendDir: 'up',
    variant: 'secondary',
    icon: 'file-text' as IconKey,
  },
  {
    label: 'Interviews Scheduled',
    value: '18',
    trend: '+5',
    trendDir: 'up',
    variant: 'success',
    icon: 'calendar-check' as IconKey,
  },
  {
    label: 'Hires This Month',
    value: '6',
    trend: '+2',
    trendDir: 'up',
    variant: 'warning',
    icon: 'user-check' as IconKey,
  },
]

const topCandidates = [
  {
    name: 'Alex Chen',
    role: 'UI/UX Designer',
    score: 94,
    skills: ['Figma', 'Prototyping'],
    initials: 'AC',
    color: '#0070f3',
  },
  {
    name: 'Maria Santos',
    role: 'Product Designer',
    score: 91,
    skills: ['Design Thinking', 'Research'],
    initials: 'MS',
    color: '#7928ca',
  },
  {
    name: 'James Park',
    role: 'UX Researcher',
    score: 88,
    skills: ['User Testing', 'Miro'],
    initials: 'JP',
    color: '#0cce6b',
  },
  {
    name: 'Lily Wang',
    role: 'Visual Designer',
    score: 85,
    skills: ['Illustration', 'After Effects'],
    initials: 'LW',
    color: '#f59e0b',
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

  return (
    <>
      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Welcome, {companyName} 🏢</h2>
            <p className="dash-page-header__subtitle">
              Manage your hiring pipeline and track performance.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__value">{s.value}</div>
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
          {/* Active jobs */}
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
                        {job.location ? ` · ${job.location}` : ''}
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

          {/* Top AI-ranked candidates */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Top AI-Ranked Candidates</div>
                <div className="dash-card__subtitle">Based on AI screening score</div>
              </div>
              <Link
                href="/recruiter/candidates"
                className="btn btn--outline btn--sm btn--icon-right"
              >
                View All <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
            <div className="dash-card__body dash-card__body--no-top">
              {topCandidates.map((c) => (
                <div key={c.name} className="item-row item-row--pad">
                  <div
                    className="item-row__logo item-row__logo--circle"
                    style={
                      {
                        '--logo-bg': c.color + '1A',
                        '--logo-color': c.color,
                      } as React.CSSProperties
                    }
                  >
                    {c.initials}
                  </div>
                  <div className="item-row__info">
                    <div className="item-row__title">{c.name}</div>
                    <div className="item-row__sub">{c.role}</div>
                    <div className="cell-actions cell-actions--mt">
                      {c.skills.map((skill) => (
                        <span key={skill} className="skill-pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className="score-pill"
                    style={
                      {
                        '--score-bg':
                          c.score >= 90 ? 'rgba(12,206,107,0.1)' : 'rgba(0,112,243,0.1)',
                        '--score-color': c.score >= 90 ? '#0cce6b' : '#0070f3',
                      } as React.CSSProperties
                    }
                  >
                    <BrainCircuit size={11} strokeWidth={2} />
                    {c.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recruiters summary — company admin only */}
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
    </>
  )
}
