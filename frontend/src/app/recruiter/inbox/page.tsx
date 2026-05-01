'use client'

import { useMemo } from 'react'

import Link from 'next/link'

import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import { Briefcase, Calendar, Mail } from 'lucide-react'

import NotificationsList from '@/components/common/NotificationsList'

export default function RecruiterInboxPage() {
  const { data: jobsResp } = useGetCompanyJobsQuery()
  const activeJobs = useMemo(
    () => (jobsResp?.data ?? []).filter((job) => job.status === 'active'),
    [jobsResp?.data],
  )

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h1 className="dash-page-header__title">Inbox</h1>
          <p className="dash-page-header__subtitle">
            Activity, pending approvals, and upcoming interviews.
          </p>
        </div>
      </div>

      <div className="dash-grid dash-grid--2col" style={{ gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Quick actions</div>
                <div className="dash-card__subtitle">
                  Routine work that may need your attention.
                </div>
              </div>
            </div>
            <div
              className="dash-card__body"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <Link
                href="/recruiter/interviews"
                className="activity-item activity-item--panel activity-item--link"
              >
                <Calendar size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                <div className="activity-item__body">
                  <p className="activity-item__text">
                    <strong>Upcoming interviews</strong>
                  </p>
                  <p className="activity-item__text">
                    Open the interview calendar to see today&rsquo;s and upcoming bookings.
                  </p>
                </div>
              </Link>

              <Link
                href="/recruiter/outreach"
                className="activity-item activity-item--panel activity-item--link"
              >
                <Mail size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                <div className="activity-item__body">
                  <p className="activity-item__text">
                    <strong>Outreach drafts</strong>
                  </p>
                  <p className="activity-item__text">
                    Review and approve drafted emails before they go out.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {activeJobs.length > 0 ? (
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Active jobs</div>
                  <div className="dash-card__subtitle">
                    Jump into a pipeline. Screening, interviews, and outreach live inside the job.
                  </div>
                </div>
              </div>
              <div
                className="dash-card__body"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                {activeJobs.slice(0, 6).map((job) => (
                  <Link
                    key={job.id}
                    href={`/recruiter/jobs/${job.id}`}
                    className="activity-item activity-item--panel activity-item--link"
                  >
                    <Briefcase size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                    <div className="activity-item__body">
                      <p className="activity-item__text">
                        <strong>{job.title}</strong>
                      </p>
                      <p className="activity-item__text">
                        {job.location_type ?? 'Remote'} · {job.applications_count ?? 0} applicant
                        {job.applications_count === 1 ? '' : 's'}
                      </p>
                    </div>
                  </Link>
                ))}
                {activeJobs.length > 6 ? (
                  <Link href="/recruiter/jobs" className="auth__inline-link">
                    View all {activeJobs.length} active jobs
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <NotificationsList emptyText="Activity for your workspace will show up here." />
      </div>
    </div>
  )
}
