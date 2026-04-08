'use client'

import { useGetMyAuditLogsQuery } from '@/store/services/auditApi'

import AuditTrailCard from '@/components/common/AuditTrailCard'
import DashboardErrorState from '@/components/common/DashboardErrorState'

export default function CandidateAuditPage() {
  const { data, isLoading, isError, error, isFetching, refetch } = useGetMyAuditLogsQuery({
    limit: 150,
  })
  const logs = data?.data ?? []

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My audit log</h2>
          <p className="dash-page-header__subtitle">
            A complete record of your applications, profile changes, resumes, and account actions.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="dash-card">
          <div className="dash-card__body">Loading your audit records...</div>
        </div>
      ) : isError ? (
        <DashboardErrorState error={error} isRetrying={isFetching} onRetry={() => void refetch()} />
      ) : (
        <AuditTrailCard
          title="Your audit entries"
          subtitle="Stored evidence of actions that affected your account and candidate journey."
          items={logs}
          emptyText="Your audit history will appear here as you use the platform."
        />
      )}
    </div>
  )
}
