'use client'

import { useMemo } from 'react'

import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'

import ActiveJobsCard from './_components/ActiveJobsCard'
import { RecruiterInboxSkeleton } from './_components/InboxSkeletons'
import NotificationsCard from './_components/NotificationsCard'
import QuickActionsCard from './_components/QuickActionsCard'
import styles from './page.module.scss'

export default function RecruiterInboxPage() {
  const { data: jobsResp, isLoading } = useGetCompanyJobsQuery()
  const activeJobs = useMemo(
    () => (jobsResp?.data ?? []).filter((job) => job.status === 'active'),
    [jobsResp?.data],
  )

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Inbox</h2>
          <p className="dash-page-header__subtitle">
            Activity, pending approvals, and upcoming interviews.
          </p>
        </div>
      </div>

      {isLoading ? (
        <RecruiterInboxSkeleton />
      ) : (
        <div className={styles.page}>
          <div className={styles.col}>
            <QuickActionsCard />
            <ActiveJobsCard jobs={activeJobs} />
          </div>
          <div className={styles.col}>
            <NotificationsCard />
          </div>
        </div>
      )}
    </div>
  )
}
