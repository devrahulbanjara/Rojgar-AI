'use client'

import { toast } from 'react-toastify'

import Link from 'next/link'

import { useAppSelector } from '@/store/hooks'
import { useUpdateRecruiterStatusMutation } from '@/store/services/companyApi'
import {
  type RecruiterAdminDashboardData,
  type RecruiterDashboardData,
  useGetRecruiterAdminDashboardQuery,
  useGetRecruiterDashboardQuery,
} from '@/store/services/dashboardApi'
import { useApproveDraftMutation } from '@/store/services/outreachApi'

import StatusPill from '@/components/common/StatusPill'

const JOB_BAR_LEGEND = [
  { label: 'Applied', tone: 'applied' },
  { label: 'Screening', tone: 'screening' },
  { label: 'Shortlisted', tone: 'shortlisted' },
  { label: 'Rejected', tone: 'rejected' },
] as const

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelativeDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getMembershipTone(
  status: 'active' | 'pending' | 'rejected',
): 'success' | 'warning' | 'gray' {
  if (status === 'active') return 'success'
  if (status === 'pending') return 'warning'
  return 'gray'
}

function isAdminDashboardData(
  dashboardData: RecruiterDashboardData | RecruiterAdminDashboardData | undefined,
): dashboardData is RecruiterAdminDashboardData {
  return Boolean(
    dashboardData && 'join_requests' in dashboardData && 'team_activity' in dashboardData,
  )
}

function getExpiryTone(daysUntilExpiry: number | null): 'danger' | 'warning' | 'success' | 'gray' {
  if (daysUntilExpiry == null) return 'gray'
  if (daysUntilExpiry <= 2) return 'danger'
  if (daysUntilExpiry <= 7) return 'warning'
  return 'success'
}

function getExpiryLabel(daysUntilExpiry: number | null): string {
  if (daysUntilExpiry == null) return 'No expiry'
  if (daysUntilExpiry <= 0) return 'Expires today'
  if (daysUntilExpiry === 1) return '1 day left'
  return `${daysUntilExpiry} days left`
}

function RecruiterDashboardSkeleton({ showAdmin }: { showAdmin: boolean }) {
  return (
    <div className="recruiter-dashboard">
      <div
        className={`dash-stats ${showAdmin ? 'recruiter-dashboard__stats--admin' : 'recruiter-dashboard__stats--recruiter'}`}
      >
        {Array.from({ length: showAdmin ? 6 : 5 }).map((_, index) => (
          <div key={index} className="stat-card" aria-hidden="true">
            <div className="skeleton-block stat-card__value-skeleton" />
            <div className="skeleton-block dashboard-card-skeleton__meta" />
          </div>
        ))}
      </div>

      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="dash-card" aria-hidden="true">
            <div className="dash-card__header">
              <div className="skeleton-block dashboard-card-skeleton__title" />
            </div>
            <div className="dash-card__body recruiter-dashboard__panel-list">
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div key={rowIndex} className="recruiter-list-card">
                  <div className="skeleton-block recruiter-list-card__title-skeleton" />
                  <div className="skeleton-block recruiter-list-card__meta-skeleton" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card" aria-hidden="true">
        <div className="dash-card__header">
          <div className="skeleton-block dashboard-card-skeleton__title" />
        </div>
        <div className="dash-card__body recruiter-dashboard__panel-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="recruiter-list-card">
              <div className="skeleton-block recruiter-list-card__title-skeleton" />
              <div className="skeleton-block recruiter-list-card__meta-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CompanyDashboardPage() {
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.primary_role === 'recruiter_admin'

  const recruiterQuery = useGetRecruiterDashboardQuery(undefined, { skip: isAdmin })
  const adminQuery = useGetRecruiterAdminDashboardQuery(undefined, { skip: !isAdmin })

  const dashboardData = isAdmin ? adminQuery.data?.data : recruiterQuery.data?.data
  const isLoading = isAdmin ? adminQuery.isLoading : recruiterQuery.isLoading
  const isError = isAdmin ? adminQuery.isError : recruiterQuery.isError

  const [approveDraft, { isLoading: isApprovingDraft }] = useApproveDraftMutation()
  const [updateRecruiterStatus, { isLoading: isUpdatingRecruiter }] =
    useUpdateRecruiterStatusMutation()
  const adminDashboardData = isAdminDashboardData(dashboardData) ? dashboardData : null

  async function handleApproveDraft(draftId: string) {
    try {
      await approveDraft({ draftId, approved: true }).unwrap()
      toast.success('Draft approved.')
    } catch {
      toast.error('Failed to approve draft.')
    }
  }

  async function handleUpdateJoinRequest(membershipId: string, status: 'active' | 'rejected') {
    try {
      await updateRecruiterStatus({ membershipId, status }).unwrap()
      toast.success(status === 'active' ? 'Recruiter approved.' : 'Recruiter rejected.')
    } catch {
      toast.error('Failed to update recruiter request.')
    }
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">
            Good morning, {dashboardData?.recruiter_name?.split(/\s+/)[0] ?? 'there'}
          </h2>
          <p className="dash-page-header__subtitle">
            {dashboardData?.company_name
              ? `${dashboardData.company_name}${isAdmin ? ' Admin' : ''} · focus on what needs action today.`
              : 'Track jobs, interviews, and candidate communication.'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <RecruiterDashboardSkeleton showAdmin={isAdmin} />
      ) : isError || !dashboardData ? (
        <div className="dash-card">
          <div className="dash-card__body">
            Dashboard data is unavailable right now. Please refresh.
          </div>
        </div>
      ) : (
        <div className="recruiter-dashboard">
          <div
            className={`dash-stats ${isAdmin ? 'recruiter-dashboard__stats recruiter-dashboard__stats--admin' : 'recruiter-dashboard__stats recruiter-dashboard__stats--recruiter'}`}
          >
            <div className="stat-card">
              <div className="stat-card__value">{dashboardData.stats.active_jobs}</div>
              <div className="stat-card__label">Active jobs</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{dashboardData.stats.total_applications}</div>
              <div className="stat-card__label">Total applicants</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value recruiter-dashboard__stat-value--primary">
                {dashboardData.stats.shortlisted}
              </div>
              <div className="stat-card__label">Shortlisted</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{dashboardData.stats.interviews_today}</div>
              <div className="stat-card__label">Interviews today</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value recruiter-dashboard__stat-value--warning">
                {dashboardData.stats.pending_drafts}
              </div>
              <div className="stat-card__label">Drafts to approve</div>
            </div>
            {adminDashboardData ? (
              <div className="stat-card">
                <div
                  className={`stat-card__value${adminDashboardData.stats.pending_join_requests > 0 ? ' recruiter-dashboard__stat-value--warning' : ' recruiter-dashboard__stat-value--primary'}`}
                >
                  {adminDashboardData.stats.pending_join_requests}
                </div>
                <div className="stat-card__label">Join requests</div>
              </div>
            ) : null}
          </div>

          <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Email drafts to approve</div>
                  <div className="dash-card__subtitle">
                    Review communication before it goes out.
                  </div>
                </div>
                <Link href="/recruiter/outreach" className="btn btn--outline btn--sm">
                  Open outreach
                </Link>
              </div>
              <div className="dash-card__body recruiter-dashboard__panel-list">
                {dashboardData.pending_drafts.length === 0 ? (
                  <div className="profile-empty">No pending drafts right now.</div>
                ) : (
                  dashboardData.pending_drafts.map((draft) => (
                    <div key={draft.draft_id} className="recruiter-list-card">
                      <div className="recruiter-list-card__top recruiter-list-card__top--compact">
                        <div className="recruiter-draft-row">
                          <span
                            className={`recruiter-draft-row__dot recruiter-draft-row__dot--${draft.email_type}`}
                          />
                          <div className="recruiter-list-card__content">
                            <div className="recruiter-list-card__title">{draft.candidate_name}</div>
                            <div className="recruiter-list-card__meta">
                              {draft.email_type === 'shortlist' ? 'Shortlist' : 'Rejection'} ·{' '}
                              {draft.job_title}
                            </div>
                          </div>
                        </div>
                        <div className="recruiter-draft-actions">
                          <button
                            className="btn btn--success btn--sm"
                            disabled={isApprovingDraft}
                            onClick={() => handleApproveDraft(draft.draft_id)}
                          >
                            Approve
                          </button>
                          <Link href="/recruiter/outreach" className="btn btn--outline btn--sm">
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Today&apos;s interviews</div>
                  <div className="dash-card__subtitle">Interview schedule for the day.</div>
                </div>
                <Link href="/recruiter/interviews" className="btn btn--outline btn--sm">
                  Open interviews
                </Link>
              </div>
              <div className="dash-card__body recruiter-dashboard__panel-list">
                {dashboardData.todays_interviews.length === 0 ? (
                  <div className="profile-empty">No interviews scheduled for today.</div>
                ) : (
                  dashboardData.todays_interviews.map((interview) => (
                    <div key={interview.interview_id} className="recruiter-list-card">
                      <div className="recruiter-interview-row">
                        <div className="recruiter-interview-row__time">
                          {formatTime(interview.start_time)}
                        </div>
                        <div className="recruiter-list-card__content">
                          <div className="recruiter-list-card__title">
                            {interview.candidate_name}
                          </div>
                          <div className="recruiter-list-card__meta">{interview.job_title}</div>
                        </div>
                        <StatusPill kind="application" status={interview.application_status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="dash-card recruiter-dashboard__jobs-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Active jobs</div>
                <div className="dash-card__subtitle">
                  Sorted by expiry urgency, with pipeline context.
                </div>
              </div>
              <Link href="/recruiter/jobs" className="btn btn--outline btn--sm">
                Manage jobs
              </Link>
            </div>
            <div className="dash-card__body recruiter-dashboard__panel-list">
              {dashboardData.active_jobs.length === 0 ? (
                <div className="profile-empty">No active jobs right now.</div>
              ) : (
                <>
                  {dashboardData.active_jobs.map((job) => (
                    <Link
                      key={job.id}
                      href="/recruiter/jobs"
                      className="recruiter-list-card recruiter-list-card--link"
                    >
                      <div className="recruiter-list-card__top">
                        <div>
                          <div className="recruiter-list-card__title">{job.title}</div>
                          <div className="recruiter-list-card__meta">
                            {job.total_applications} applicants ·{' '}
                            {getExpiryLabel(job.days_until_expiry)}
                          </div>
                        </div>
                        <span className={`badge badge--${getExpiryTone(job.days_until_expiry)}`}>
                          {getExpiryLabel(job.days_until_expiry)}
                        </span>
                      </div>

                      <div className="recruiter-job-bar">
                        <span
                          className="recruiter-job-bar__segment recruiter-job-bar__segment--applied"
                          style={{ flex: Math.max(job.applied_count, 1) }}
                        />
                        <span
                          className="recruiter-job-bar__segment recruiter-job-bar__segment--screening"
                          style={{ flex: Math.max(job.screening_count, 1) }}
                        />
                        <span
                          className="recruiter-job-bar__segment recruiter-job-bar__segment--shortlisted"
                          style={{ flex: Math.max(job.shortlisted_count, 1) }}
                        />
                        <span
                          className="recruiter-job-bar__segment recruiter-job-bar__segment--rejected"
                          style={{ flex: Math.max(job.rejected_count, 1) }}
                        />
                      </div>
                    </Link>
                  ))}

                  <div className="recruiter-dashboard__legend">
                    {JOB_BAR_LEGEND.map((item) => (
                      <span key={item.label} className="recruiter-dashboard__legend-item">
                        <span
                          className={`recruiter-dashboard__legend-dot recruiter-dashboard__legend-dot--${item.tone}`}
                        />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {adminDashboardData ? (
            <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
              <div className="dash-card">
                <div className="dash-card__header">
                  <div>
                    <div className="dash-card__title">Team join requests</div>
                    <div className="dash-card__subtitle">
                      Approve or reject pending recruiter access.
                    </div>
                  </div>
                  <Link href="/recruiter/recruiters" className="btn btn--outline btn--sm">
                    Manage team
                  </Link>
                </div>
                <div className="dash-card__body recruiter-dashboard__panel-list">
                  {adminDashboardData.join_requests.length === 0 ? (
                    <div className="profile-empty">No pending join requests.</div>
                  ) : (
                    adminDashboardData.join_requests.map((request) => (
                      <div key={request.membership_id} className="recruiter-list-card">
                        <div className="recruiter-list-card__top recruiter-list-card__top--compact">
                          <div className="recruiter-list-card__content">
                            <div className="recruiter-list-card__title">
                              {request.recruiter_name}
                            </div>
                            <div className="recruiter-list-card__meta">
                              {request.recruiter_email} · Requested{' '}
                              {formatRelativeDate(request.requested_at)}
                            </div>
                          </div>
                          <div className="recruiter-draft-actions">
                            <button
                              className="btn btn--success btn--sm"
                              disabled={isUpdatingRecruiter}
                              onClick={() =>
                                handleUpdateJoinRequest(request.membership_id, 'active')
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn--danger btn--sm"
                              disabled={isUpdatingRecruiter}
                              onClick={() =>
                                handleUpdateJoinRequest(request.membership_id, 'rejected')
                              }
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card__header">
                  <div>
                    <div className="dash-card__title">Team activity</div>
                    <div className="dash-card__subtitle">
                      Monthly shortlist and interview movement across the team.
                    </div>
                  </div>
                </div>
                <div className="dash-card__body recruiter-dashboard__panel-list">
                  {adminDashboardData.team_activity.length === 0 ? (
                    <div className="profile-empty">No team activity available yet.</div>
                  ) : (
                    adminDashboardData.team_activity.map((member) => (
                      <div key={member.membership_id} className="recruiter-list-card">
                        <div className="recruiter-list-card__top recruiter-list-card__top--compact">
                          <div className="recruiter-list-card__content">
                            <div className="recruiter-list-card__title">
                              {member.recruiter_name}
                            </div>
                            <div className="recruiter-list-card__meta recruiter-team-activity__meta">
                              {member.membership_status !== 'active' ? (
                                <span
                                  className={`badge badge--${getMembershipTone(member.membership_status)}`}
                                >
                                  {member.membership_status === 'pending' ? 'Pending' : 'Rejected'}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="recruiter-team-activity">
                          <div className="recruiter-team-activity__row">
                            <span className="recruiter-team-activity__label">Shortlisted</span>
                            <div className="recruiter-team-activity__bar">
                              <span
                                className="recruiter-team-activity__fill"
                                style={{
                                  width: `${Math.min(member.shortlisted_this_month * 8, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="recruiter-team-activity__count">
                              {member.shortlisted_this_month}
                            </span>
                          </div>
                          <div className="recruiter-team-activity__row">
                            <span className="recruiter-team-activity__label">Interviews</span>
                            <div className="recruiter-team-activity__bar">
                              <span
                                className="recruiter-team-activity__fill recruiter-team-activity__fill--success"
                                style={{
                                  width: `${Math.min(member.interviews_this_month * 10, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="recruiter-team-activity__count">
                              {member.interviews_this_month}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

        </div>
      )}
    </div>
  )
}
