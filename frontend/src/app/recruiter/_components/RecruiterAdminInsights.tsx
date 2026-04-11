'use client'

import { type RecruiterAdminDashboardAnalyticsData } from '@/store/services/dashboardApi'

type RecruiterAdminInsightsProps = {
  analytics: RecruiterAdminDashboardAnalyticsData | undefined
  isLoading: boolean
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function InsightsSkeleton() {
  return (
    <>
      <div className="dashboard-metric-grid dashboard-metric-grid--recruiter-admin-top">
        {[
          {
            key: 'active-recruiters',
            label: 'Active recruiters',
          },
          {
            key: 'pending-join-requests',
            label: 'Pending join requests',
          },
          { key: 'requested', label: 'Requested' },
          { key: 'approved', label: 'Approved' },
        ].map((item) => (
          <div key={item.key} className="stat-card dashboard-metric-card" aria-hidden="true">
            <div className="dashboard-metric-card__copy">
              <div className="skeleton-block dashboard-card-skeleton__value" />
              <div className="stat-card__label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Team access status</div>
              <div className="dash-card__subtitle">
                Current company membership mix across active, pending, and rejected access.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>

        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Join request trend</div>
              <div className="dash-card__subtitle">
                Requested, approved, and rejected team access over time.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>
      </div>

      <div className="dash-card" aria-hidden="true">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Recruiter workload</div>
            <div className="dash-card__subtitle">
              Real job ownership and this month&apos;s shortlist and interview activity.
            </div>
          </div>
        </div>
        <div className="dash-card__body recruiter-dashboard__analytics-body">
          <div className="skeleton-block dashboard-analytics__chart-skeleton dashboard-analytics__chart-skeleton--tall" />
        </div>
      </div>
    </>
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

  const maxMembership = Math.max(...analytics.membership_breakdown.map((item) => item.count), 1)
  const maxJoinRequests = Math.max(
    ...analytics.join_request_timeseries.map((item) => item.requested),
    1,
  )
  const requestedTotal = analytics.join_request_timeseries.reduce(
    (sum, item) => sum + item.requested,
    0,
  )
  const approvedTotal = analytics.join_request_timeseries.reduce(
    (sum, item) => sum + item.approved,
    0,
  )
  const rejectedTotal = analytics.join_request_timeseries.reduce(
    (sum, item) => sum + item.rejected,
    0,
  )
  const pendingJoinRequestsValueClassName =
    analytics.stats.pending_join_requests > 0
      ? 'stat-card__value recruiter-dashboard__stat-value--warning'
      : 'stat-card__value'
  const approvedValueClassName =
    rejectedTotal > 0
      ? 'stat-card__value recruiter-dashboard__stat-value--primary'
      : 'stat-card__value'

  return (
    <>
      <div className="dashboard-metric-grid dashboard-metric-grid--recruiter-admin-top">
        <div className="stat-card dashboard-metric-card">
          <div className="dashboard-metric-card__copy">
            <div className="stat-card__value">{analytics.stats.active_recruiters}</div>
            <div className="stat-card__label">Active recruiters</div>
          </div>
        </div>

        <div className="stat-card dashboard-metric-card">
          <div className="dashboard-metric-card__copy">
            <div className={pendingJoinRequestsValueClassName}>
              {analytics.stats.pending_join_requests}
            </div>
            <div className="stat-card__label">Pending join requests</div>
          </div>
        </div>

        <div className="stat-card dashboard-metric-card">
          <div className="dashboard-metric-card__copy">
            <div className="stat-card__value">{requestedTotal}</div>
            <div className="stat-card__label">Requested</div>
          </div>
        </div>

        <div className="stat-card dashboard-metric-card">
          <div className="dashboard-metric-card__copy">
            <div className={approvedValueClassName}>{approvedTotal}</div>
            <div className="stat-card__label">Approved</div>
          </div>
        </div>
      </div>

      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Team access status</div>
              <div className="dash-card__subtitle">
                Current company membership mix across active, pending, and rejected access.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="dashboard-funnel-list">
              {analytics.membership_breakdown.map((item) => (
                <div key={item.status} className="dashboard-funnel-list__row">
                  <div className="dashboard-funnel-list__label">{item.status}</div>
                  <div className="dashboard-funnel-list__track">
                    <span
                      className={`dashboard-funnel-list__fill dashboard-funnel-list__fill--${item.status}`}
                      style={{ width: `${(item.count / maxMembership) * 100}%` }}
                    />
                  </div>
                  <div className="dashboard-funnel-list__value">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Join request trend</div>
              <div className="dash-card__subtitle">
                Requested, approved, and rejected team access over time.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="dashboard-bar-cluster dashboard-bar-cluster--wide">
              {analytics.join_request_timeseries.map((item) => (
                <div key={item.date} className="dashboard-bar-cluster__item">
                  <div className="dashboard-bar-cluster__value">{item.requested}</div>
                  <div className="dashboard-bar-cluster__track">
                    <span
                      className="dashboard-bar-cluster__fill"
                      style={{ height: `${(item.requested / maxJoinRequests) * 100}%` }}
                    />
                  </div>
                  <div className="dashboard-bar-cluster__label">{formatShortDate(item.date)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Recruiter workload</div>
            <div className="dash-card__subtitle">
              Real job ownership and this month&apos;s shortlist and interview activity.
            </div>
          </div>
        </div>
        <div className="dash-card__body recruiter-dashboard__analytics-body">
          <div className="dashboard-job-health dashboard-job-health--team">
            {analytics.team_activity.map((member) => {
              const max = Math.max(
                member.active_jobs,
                member.shortlisted_this_month,
                member.interviews_this_month,
                1,
              )
              return (
                <div key={member.membership_id} className="dashboard-job-health__row">
                  <div className="dashboard-job-health__titleRow">
                    <div>
                      <div className="dashboard-job-health__title">{member.recruiter_name}</div>
                      <div className="dashboard-job-health__meta">
                        {member.membership_status === 'active'
                          ? `${member.active_jobs} active job${member.active_jobs === 1 ? '' : 's'}`
                          : member.membership_status}
                      </div>
                    </div>
                    <div className="dashboard-job-health__stats">
                      <span>{member.shortlisted_this_month} shortlisted</span>
                      <span>{member.interviews_this_month} interviews</span>
                    </div>
                  </div>

                  <div className="dashboard-job-health__bar">
                    <span
                      className="dashboard-job-health__fill dashboard-job-health__fill--applications"
                      style={{ width: `${(member.active_jobs / max) * 100}%` }}
                    />
                    <span
                      className="dashboard-job-health__fill dashboard-job-health__fill--shortlisted"
                      style={{ width: `${(member.shortlisted_this_month / max) * 100}%` }}
                    />
                    <span
                      className="dashboard-job-health__fill dashboard-job-health__fill--interviews"
                      style={{ width: `${(member.interviews_this_month / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
