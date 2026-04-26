'use client'

import { type RecruiterAdminDashboardAnalyticsData } from '@/store/services/dashboardApi'

type RecruiterAdminInsightsProps = {
  analytics: RecruiterAdminDashboardAnalyticsData | undefined
  isLoading: boolean
}

function InsightsSkeleton() {
  return (
    <div className="dashboard-admin-team-row">
      <div className="stat-card stat-card--compact" aria-hidden="true">
        <div className="skeleton-block dashboard-card-skeleton__value" />
        <div className="stat-card__label">Active recruiters</div>
      </div>
      <div className="stat-card stat-card--compact" aria-hidden="true">
        <div className="skeleton-block dashboard-card-skeleton__value" />
        <div className="stat-card__label">Pending join requests</div>
      </div>
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

  const pendingClass =
    analytics.stats.pending_join_requests > 0
      ? 'stat-card__value recruiter-dashboard__stat-value--warning'
      : 'stat-card__value'

  return (
    <div className="dashboard-admin-team-row">
      <div className="stat-card stat-card--compact">
        <div className="stat-card__value">{analytics.stats.active_recruiters}</div>
        <div className="stat-card__label">Active recruiters</div>
      </div>
      <div className="stat-card stat-card--compact">
        <div className={pendingClass}>{analytics.stats.pending_join_requests}</div>
        <div className="stat-card__label">Pending join requests</div>
      </div>
    </div>
  )
}
