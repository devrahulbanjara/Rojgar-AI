'use client'

import Link from 'next/link'

import { useAppSelector } from '@/store/hooks'
import { useGetCompanyRecruitersQuery } from '@/store/services/companyApi'
import type { RecruiterMember } from '@/store/services/companyApi'

const stats = [
  {
    label: 'Active Job Posts',
    value: '12',
    trend: '+2',
    trendDir: 'up',
    variant: 'primary',
    icon: '📋',
  },
  {
    label: 'Total Applications',
    value: '342',
    trend: '+48',
    trendDir: 'up',
    variant: 'secondary',
    icon: '📩',
  },
  {
    label: 'Interviews Scheduled',
    value: '18',
    trend: '+5',
    trendDir: 'up',
    variant: 'success',
    icon: '📅',
  },
  {
    label: 'Hires This Month',
    value: '6',
    trend: '+2',
    trendDir: 'up',
    variant: 'warning',
    icon: '🎉',
  },
]

const activeJobs = [
  {
    title: 'Product Designer',
    applications: 50,
    new: 12,
    daysLeft: 5,
    logo: 'P',
    color: '#7928ca',
  },
  {
    title: 'Visual Designer',
    applications: 74,
    new: 8,
    daysLeft: 3,
    logo: 'P',
    color: '#7928ca',
  },
  {
    title: 'Senior UX Designer',
    applications: 31,
    new: 5,
    daysLeft: 10,
    logo: 'P',
    color: '#7928ca',
  },
  {
    title: 'Interaction Designer',
    applications: 27,
    new: 3,
    daysLeft: 15,
    logo: 'P',
    color: '#7928ca',
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

const recentActivity = [
  {
    text: '<strong>Alex Chen</strong> applied for Product Designer.',
    time: '1 h ago',
  },
  {
    text: '<strong>AI Screening</strong> ranked 12 new candidates.',
    time: '2 h ago',
  },
  {
    text: 'Interview scheduled with <strong>Maria Santos</strong>.',
    time: '3 h ago',
  },
  {
    text: '<strong>Visual Designer</strong> post expires in 3 days.',
    time: 'Today',
  },
  {
    text: '<strong>James Park</strong> accepted the offer.',
    time: 'Yesterday',
  },
]

export default function CompanyDashboardPage() {
  const { user } = useAppSelector((s) => s.auth)
  const isCompanyAdmin = user?.primary_role === 'recruiter_admin'

  const { data: recruitersResp } = useGetCompanyRecruitersQuery(undefined, {
    skip: !isCompanyAdmin,
  })

  const recruiters: RecruiterMember[] = recruitersResp?.data ?? []
  const activeRecruiters = recruiters.filter((r) => r.status === 'active')
  const pendingRecruiters = recruiters.filter((r) => r.status === 'pending')

  return (
    <>
      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Welcome, Pickolab Studio 🏢</h2>
            <p className="dash-page-header__subtitle">
              Manage your hiring pipeline and track performance.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__header">
                <div className="stat-card__icon-emoji">{s.icon}</div>
                <span className={`stat-card__trend stat-card__trend--${s.trendDir}`}>
                  {s.trend}
                </span>
              </div>
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="dash-grid dash-grid--2col">
          {/* Active jobs */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Active Job Posts</div>
                <div className="dash-card__subtitle">Currently open positions</div>
              </div>
              <Link href="/company/jobs" className="btn btn--outline btn--sm">
                Manage
              </Link>
            </div>
            <div className="dash-card__body dash-card__body--no-top">
              {activeJobs.map((job) => (
                <div key={job.title} className="item-row item-row--pad">
                  <div
                    className="item-row__logo"
                    style={
                      {
                        '--logo-bg': job.color + '1A',
                        '--logo-color': job.color,
                      } as React.CSSProperties
                    }
                  >
                    {job.logo}
                  </div>
                  <div className="item-row__info">
                    <div className="item-row__title">{job.title}</div>
                    <div className="item-row__sub">
                      {job.applications} total · {job.new} new
                    </div>
                  </div>
                  <div className="item-row__right">
                    <div
                      className="item-row__expires"
                      style={
                        {
                          '--expires-color': job.daysLeft <= 5 ? '#ff4d4d' : '#6b7280',
                        } as React.CSSProperties
                      }
                    >
                      {job.daysLeft}d left
                    </div>
                    <div className="progress-bar progress-bar--narrow-md">
                      <div
                        className="progress-bar__fill"
                        style={{ width: `${Math.min(job.applications, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top AI-ranked candidates */}
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Top AI-Ranked Candidates</div>
                <div className="dash-card__subtitle">Based on AI screening score</div>
              </div>
              <Link href="/company/candidates" className="btn btn--outline btn--sm">
                View All
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
                    {c.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__title">Recent Activity</div>
          </div>
          <div className="dash-card__body dash-card__body--activity">
            <div className="activity-list">
              {recentActivity.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-item__dot" />
                  <div className="activity-item__body">
                    <p
                      className="activity-item__text"
                      dangerouslySetInnerHTML={{ __html: a.text }}
                    />
                    <div className="activity-item__time">{a.time}</div>
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
              <Link href="/company/recruiters" className="btn btn--outline btn--sm">
                Manage
              </Link>
            </div>
            <div className="dash-card__body dash-card__body--no-top">
              <div
                className="dash-stats"
                style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}
              >
                <div className="stat-card">
                  <div className="stat-card__header">
                    <div className="stat-card__icon-emoji">👥</div>
                  </div>
                  <div className="stat-card__value">{activeRecruiters.length}</div>
                  <div className="stat-card__label">Active Recruiters</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__header">
                    <div className="stat-card__icon-emoji">⏳</div>
                    {pendingRecruiters.length > 0 && (
                      <span
                        className="stat-card__trend stat-card__trend--up"
                        style={{ background: '#f59e0b1A', color: '#f59e0b' }}
                      >
                        +{pendingRecruiters.length}
                      </span>
                    )}
                  </div>
                  <div className="stat-card__value">{pendingRecruiters.length}</div>
                  <div className="stat-card__label">Pending Requests</div>
                </div>
              </div>
              {pendingRecruiters.length > 0 && (
                <Link
                  href="/company/recruiters"
                  className="btn btn--warning btn--sm"
                  style={{ marginTop: '1rem', display: 'inline-flex' }}
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
