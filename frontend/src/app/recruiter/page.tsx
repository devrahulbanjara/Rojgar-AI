'use client'

import { useState } from 'react'

import { useAppSelector } from '@/store/hooks'
import {
  useGetRecruiterAdminDashboardAnalyticsQuery,
  useGetRecruiterAdminDashboardQuery,
  useGetRecruiterDashboardAnalyticsQuery,
  useGetRecruiterDashboardQuery,
} from '@/store/services/dashboardApi'

import DashboardErrorState from '@/components/common/DashboardErrorState'

import RecruiterAdminInsights from './_components/RecruiterAdminInsights'
import RecruiterDashboardInsights from './_components/RecruiterDashboardInsights'

export default function CompanyDashboardPage() {
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.primary_role === 'recruiter_admin'
  const [analyticsRangeKey, setAnalyticsRangeKey] = useState<'7d' | '30d' | '90d'>('30d')

  const recruiterQuery = useGetRecruiterDashboardQuery(undefined, { skip: isAdmin })
  const adminQuery = useGetRecruiterAdminDashboardQuery(undefined, { skip: !isAdmin })
  const recruiterAnalyticsQuery = useGetRecruiterDashboardAnalyticsQuery(analyticsRangeKey)
  const adminAnalyticsQuery = useGetRecruiterAdminDashboardAnalyticsQuery(analyticsRangeKey, {
    skip: !isAdmin,
  })

  const dashboardData = isAdmin ? adminQuery.data?.data : recruiterQuery.data?.data
  const isLoading = isAdmin ? adminQuery.isLoading : recruiterQuery.isLoading
  const isError = isAdmin ? adminQuery.isError : recruiterQuery.isError
  const recruiterAnalyticsData = recruiterAnalyticsQuery.data?.data
  const adminAnalyticsData = isAdmin ? adminAnalyticsQuery.data?.data : undefined
  const isAnalyticsLoading = isAdmin
    ? adminAnalyticsQuery.isLoading || recruiterAnalyticsQuery.isLoading
    : recruiterAnalyticsQuery.isLoading
  const dashboardError = isAdmin ? adminQuery.error : recruiterQuery.error
  const isRetrying = isAdmin
    ? adminQuery.isFetching || adminAnalyticsQuery.isFetching || recruiterAnalyticsQuery.isFetching
    : recruiterQuery.isFetching || recruiterAnalyticsQuery.isFetching

  async function handleRetryDashboard() {
    if (isAdmin) {
      await Promise.allSettled([
        adminQuery.refetch(),
        adminAnalyticsQuery.refetch(),
        recruiterAnalyticsQuery.refetch(),
      ])
      return
    }

    await Promise.allSettled([recruiterQuery.refetch(), recruiterAnalyticsQuery.refetch()])
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">
            Good morning,
            {isLoading ? (
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
              ` ${dashboardData?.recruiter_name?.split(/\s+/)[0] ?? 'there'}`
            )}
          </h2>
          <p className="dash-page-header__subtitle">
            {isLoading ? (
              <>
                <span
                  className="skeleton-block"
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: isAdmin ? '160px' : '140px',
                    height: '16px',
                    marginRight: '8px',
                    verticalAlign: 'middle',
                  }}
                />
                <span>| hiring at a glance.</span>
              </>
            ) : dashboardData?.company_name ? (
              `${dashboardData.company_name}${isAdmin ? ' Admin' : ''} | hiring at a glance.`
            ) : (
              'Track your pipeline, team, and hiring momentum.'
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="recruiter-dashboard">
          <RecruiterDashboardInsights
            analytics={undefined}
            isLoading={true}
            rangeKey={analyticsRangeKey}
            onRangeChange={setAnalyticsRangeKey}
          />
          {isAdmin ? <RecruiterAdminInsights analytics={undefined} isLoading={true} /> : null}
        </div>
      ) : isError || !dashboardData ? (
        <DashboardErrorState
          error={dashboardError}
          isRetrying={isRetrying}
          onRetry={handleRetryDashboard}
        />
      ) : (
        <div className="recruiter-dashboard">
          <RecruiterDashboardInsights
            analytics={recruiterAnalyticsData}
            isLoading={isAnalyticsLoading}
            rangeKey={analyticsRangeKey}
            onRangeChange={setAnalyticsRangeKey}
          />

          {isAdmin ? (
            <RecruiterAdminInsights analytics={adminAnalyticsData} isLoading={isAnalyticsLoading} />
          ) : null}
        </div>
      )}
    </div>
  )
}
