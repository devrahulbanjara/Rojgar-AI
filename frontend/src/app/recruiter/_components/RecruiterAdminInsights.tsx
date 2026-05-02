'use client'

import {
  type RecruiterAdminDashboardAnalyticsData,
  type TeamMemberActivity,
} from '@/store/services/dashboardApi'

type RecruiterAdminInsightsProps = {
  analytics: RecruiterAdminDashboardAnalyticsData | undefined
  isLoading: boolean
}

const ADMIN_METRICS = [
  { key: 'active_recruiters', label: 'Active recruiters', tone: 'primary' },
  { key: 'pending_join_requests', label: 'Pending requests', tone: 'warning' },
  { key: 'active_jobs', label: 'Active jobs', tone: 'secondary' },
  { key: 'applications', label: 'Applications', tone: 'accent' },
] as const

const STATUS_LABELS: Record<TeamMemberActivity['membership_status'], string> = {
  active: 'Active',
  pending: 'Pending',
  rejected: 'Rejected',
}

function getValueClassName(key: (typeof ADMIN_METRICS)[number]['key'], value: number): string {
  if (key === 'pending_join_requests' && value > 0) {
    return 'stat-card__value recruiter-dashboard__stat-value--warning'
  }
  return 'stat-card__value'
}

function InsightsSkeleton() {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__eyebrow">Team overview</div>
          <div className="dash-card__subtitle">Individual recruiter contributions this period.</div>
        </div>
      </div>
      <div className="dash-card__body dashboard-admin-section">
        <div className="dashboard-metric-grid dashboard-metric-grid--admin">
          {ADMIN_METRICS.map((item) => (
            <div key={item.key} className="stat-card stat-card--compact" aria-hidden="true">
              <div className="skeleton-block dashboard-card-skeleton__value" />
              <div className="stat-card__label">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="skeleton-block dashboard-analytics__chart-skeleton" />
      </div>
    </div>
  )
}

function TeamActivityList({ members }: { members: TeamMemberActivity[] }) {
  if (members.length === 0) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty__title">No team members yet</div>
        <p className="dashboard-empty__copy">
          Invite recruiters to your company and their activity will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="dashboard-team-list">
      <div className="dashboard-team-list__header">
        <span>Recruiter</span>
        <span>Status</span>
        <span>Jobs</span>
        <span>Shortlisted</span>
      </div>
      {members.map((member) => (
        <div key={member.membership_id} className="dashboard-team-list__row">
          <div className="dashboard-team-list__name">{member.recruiter_name}</div>
          <div className="dashboard-team-list__status">
            <span
              className={`dashboard-team-list__dot dashboard-team-list__dot--${member.membership_status}`}
            />
            {STATUS_LABELS[member.membership_status]}
          </div>
          <div className="dashboard-team-list__metric">{member.active_jobs}</div>
          <div className="dashboard-team-list__metric">{member.shortlisted_this_month}</div>
        </div>
      ))}
    </div>
  )
}

export default function RecruiterAdminInsights({
  analytics,
  isLoading,
}: RecruiterAdminInsightsProps) {
  if (isLoading && !analytics) {
    return <InsightsSkeleton />
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__eyebrow">Team overview</div>
          <div className="dash-card__subtitle">Individual recruiter contributions this period.</div>
        </div>
      </div>
      <div className="dash-card__body dashboard-admin-section">
        <div className="dashboard-metric-grid dashboard-metric-grid--admin">
          {ADMIN_METRICS.map((item) => {
            const value = analytics.stats[item.key]
            return (
              <div key={item.key} className="stat-card stat-card--compact">
                <div className={getValueClassName(item.key, value)}>{value}</div>
                <div className="stat-card__label">{item.label}</div>
              </div>
            )
          })}
        </div>
        <TeamActivityList members={analytics.team_activity} />
      </div>
    </div>
  )
}
