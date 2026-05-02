'use client'

import { useMemo, useState } from 'react'
import { notify } from '@/lib/notify'
import { calculateProfileCompletionPercentage } from '@/lib/profileCompletion'
import { useAppSelector } from '@/store/hooks'
import {
  useGetCandidateDashboardAnalyticsQuery,
  useGetCandidateDashboardQuery,
} from '@/store/services/dashboardApi'
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from '@/store/services/profileApi'

import DashboardErrorState from '@/components/common/DashboardErrorState'

import CandidateDashboardInsights from './_components/CandidateDashboardInsights'

function getFirstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? 'there'
}

export default function UserDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const [analyticsRangeKey, setAnalyticsRangeKey] = useState<'7d' | '30d' | '90d'>('30d')
  const {
    data: dashboardResponse,
    isLoading,
    isError,
    isFetching,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetCandidateDashboardQuery()
  const {
    data: analyticsResponse,
    isLoading: isAnalyticsLoading,
    isFetching: isFetchingAnalytics,
    refetch: refetchAnalytics,
  } = useGetCandidateDashboardAnalyticsQuery(analyticsRangeKey)
  const {
    data: profileResponse,
    isFetching: isFetchingProfile,
    refetch: refetchProfile,
  } = useGetMyProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation()
  const dashboardData = dashboardResponse?.data
  const analyticsData = analyticsResponse?.data
  const profile = profileResponse?.data
  const profileCompletion = useMemo(
    () => calculateProfileCompletionPercentage(profile ?? null),
    [profile],
  )

  const handleToggleOpenToWork = async () => {
    if (!dashboardData || isUpdating) return

    try {
      const newStatus = !dashboardData.is_open_to_work
      await updateProfile({ is_open_to_work: newStatus }).unwrap()
      notify.success(newStatus ? "You're now 'Open to Work'!" : 'Open to Work disabled.')
      refetchDashboard()
    } catch {
      notify.error('Failed to update status.')
    }
  }

  const handleRetryDashboard = async () => {
    await Promise.allSettled([refetchDashboard(), refetchAnalytics(), refetchProfile()])
  }

  const firstName = getFirstName(user?.full_name ?? dashboardData?.user_name)

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <div className="dash-page-header__title-row">
            <h1 className="dash-page-header__title">
              Good morning,
              {isLoading && !user ? (
                <span
                  className="skeleton-block"
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: '120px',
                    height: '36px',
                    marginLeft: '8px',
                    verticalAlign: 'middle',
                  }}
                />
              ) : (
                ` ${firstName}`
              )}
            </h1>

            <div className="dash-page-header__status-inline">
              {isLoading ? (
                <div className="skeleton-block" style={{ width: '100px', height: '16px' }} />
              ) : (
                <div className="open-to-work-status open-to-work-status--header">
                  <span
                    className={`open-to-work-status__dot ${dashboardData?.is_open_to_work ? 'open-to-work-status__dot--active' : ''}`}
                  />
                  <span className="open-to-work-status__text">
                    Open to Work {dashboardData?.is_open_to_work ? '| Active' : '| Off'}
                  </span>
                  <button
                    className={`btn btn--secondary btn--sm${isUpdating ? ' btn--loading' : ''}`}
                    aria-pressed={dashboardData?.is_open_to_work ?? false}
                    onClick={handleToggleOpenToWork}
                    disabled={isUpdating}
                  >
                    [{dashboardData?.is_open_to_work ? 'Turn off' : 'Turn on'}]
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="dash-page-header__subtitle">
            Track your applications and stay ready for what comes next.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="candidate-dashboard">
          <CandidateDashboardInsights
            analytics={undefined}
            isLoading={true}
            rangeKey={analyticsRangeKey}
            onRangeChange={setAnalyticsRangeKey}
            readiness={{ completion: 0, targetRoles: 0, skills: 0, isOpenToWork: false }}
          />
        </div>
      ) : isError || !dashboardData ? (
        <DashboardErrorState
          error={dashboardError}
          isRetrying={isFetching || isFetchingAnalytics || isFetchingProfile}
          onRetry={handleRetryDashboard}
        />
      ) : (
        <div className="candidate-dashboard">
          <CandidateDashboardInsights
            analytics={analyticsData}
            isLoading={isAnalyticsLoading}
            rangeKey={analyticsRangeKey}
            onRangeChange={setAnalyticsRangeKey}
            readiness={{
              completion: profileCompletion,
              targetRoles: profile?.target_roles.length ?? 0,
              skills: profile?.skills.length ?? 0,
              isOpenToWork: dashboardData.is_open_to_work,
            }}
          />
        </div>
      )}
    </div>
  )
}
