'use client'

import { useMemo, useState } from 'react'

import { useAppSelector } from '@/store/hooks'
import { useGetCompanyAuditLogsQuery, useGetMyAuditLogsQuery } from '@/store/services/auditApi'

import AuditTrailCard from '@/components/common/AuditTrailCard'
import DashboardErrorState from '@/components/common/DashboardErrorState'

const ENTITY_OPTIONS = [
  '',
  'job',
  'application',
  'membership',
  'user',
  'auth_session',
  'email_draft',
  'interview',
  'profile',
  'resume',
  'job_ai_draft',
  'chat_session',
] as const

const ACTION_OPTIONS = [
  '',
  'create',
  'update',
  'delete',
  'status_transition',
  'approve',
  'reject',
  'send',
  'login',
  'logout',
  'refresh',
] as const

export default function RecruiterAuditPage() {
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.primary_role === 'recruiter_admin'
  const [entityType, setEntityType] = useState<string>('')
  const [actionType, setActionType] = useState<string>('')
  const params = useMemo(
    () => ({
      limit: 150,
      entity_type: entityType || undefined,
      action_type: actionType || undefined,
    }),
    [actionType, entityType],
  )

  const companyAuditQuery = useGetCompanyAuditLogsQuery(params, { skip: !isAdmin })
  const myAuditQuery = useGetMyAuditLogsQuery(
    {
      limit: 150,
      entity_type: entityType || undefined,
      action_type: actionType || undefined,
    },
    { skip: isAdmin },
  )

  const logs = isAdmin ? (companyAuditQuery.data?.data ?? []) : (myAuditQuery.data?.data ?? [])
  const isLoading = isAdmin ? companyAuditQuery.isLoading : myAuditQuery.isLoading
  const isError = isAdmin ? companyAuditQuery.isError : myAuditQuery.isError
  const error = isAdmin ? companyAuditQuery.error : myAuditQuery.error
  const isFetching = isAdmin ? companyAuditQuery.isFetching : myAuditQuery.isFetching

  async function handleRetry() {
    if (isAdmin) {
      await companyAuditQuery.refetch()
      return
    }
    await myAuditQuery.refetch()
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">
            {isAdmin ? 'Company audit log' : 'My audit log'}
          </h2>
          <p className="dash-page-header__subtitle">
            {isAdmin
              ? 'Immutable audit entries for company-owned actions and state changes.'
              : 'A complete record of actions and state changes directly related to your recruiter account.'}
          </p>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__body audit-console__filters">
          <label className="auth__field">
            <span className="auth__label">Entity</span>
            <select
              className="resume-field__input"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            >
              {ENTITY_OPTIONS.map((option) => (
                <option key={option || 'all'} value={option}>
                  {option || 'All entities'}
                </option>
              ))}
            </select>
          </label>

          <label className="auth__field">
            <span className="auth__label">Action</span>
            <select
              className="resume-field__input"
              value={actionType}
              onChange={(event) => setActionType(event.target.value)}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option || 'all'} value={option}>
                  {option || 'All actions'}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="dash-card">
          <div className="dash-card__body">Loading audit records...</div>
        </div>
      ) : isError ? (
        <DashboardErrorState
          error={error}
          isRetrying={isFetching}
          onRetry={() => void handleRetry()}
        />
      ) : (
        <AuditTrailCard
          title={isAdmin ? 'Audit entries' : 'Your audit entries'}
          subtitle={
            isAdmin
              ? 'Searchable company-wide evidence for state changes, approvals, deletes, and access-sensitive actions.'
              : 'Stored evidence for actions that affected your recruiter account, assignments, and recruiter-owned workflow changes.'
          }
          items={logs}
          emptyText="No audit entries match the current filters."
        />
      )}
    </div>
  )
}
