'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import {
  useGetJobApplicationsQuery,
  useUpdateApplicationStatusMutation,
} from '@/store/services/applicationsApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import {
  useFinalizeShortlistMutation,
  useGetShortlistSummaryQuery,
  useTriggerShortlistingMutation,
} from '@/store/services/shortlistingApi'

import { ScreeningStatusCardSkeleton, ScreeningTableSkeleton } from './_components/ScreeningSkeletons'

function scoreBadgeClass(score: number | null) {
  if (score == null) return 'gray'
  if (score >= 70) return 'success'
  if (score >= 40) return 'warning'
  return 'danger'
}

export default function RecruiterScreeningPage() {
  const { data: jobsResp, isLoading: isLoadingJobs } = useGetCompanyJobsQuery()
  const jobs = jobsResp?.data.filter((job) => job.status === 'active') ?? []
  const [selectedJobId, setSelectedJobId] = useState('')
  const [threshold, setThreshold] = useState(70)
  const [shouldPollSummary, setShouldPollSummary] = useState(false)

  useEffect(() => {
    if (!selectedJobId && jobs[0]) setSelectedJobId(jobs[0].id)
  }, [jobs, selectedJobId])

  const {
    data: summaryResp,
    refetch: refetchSummary,
    isLoading: isLoadingSummary,
  } = useGetShortlistSummaryQuery(selectedJobId, {
    skip: !selectedJobId,
    pollingInterval: shouldPollSummary ? 10000 : 0,
  })
  const {
    data: appsResp,
    refetch: refetchApps,
    isLoading: isLoadingApps,
    isFetching: isFetchingApps,
  } = useGetJobApplicationsQuery(
    { job_id: selectedJobId, page: 1, size: 100 },
    { skip: !selectedJobId },
  )
  const [triggerShortlisting, { isLoading: isTriggering }] = useTriggerShortlistingMutation()
  const [finalizeShortlist, { isLoading: isFinalizing }] = useFinalizeShortlistMutation()
  const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation()

  const summary = summaryResp?.data
  const applications = useMemo(
    () => [...(appsResp?.data ?? [])].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
    [appsResp?.data],
  )
  const canRunScreening =
    summary != null &&
    summary.total_applications > 0 &&
    (summary.shortlist_status === 'not_started' || summary.shortlist_status === 'failed')

  useEffect(() => {
    setShouldPollSummary(summary?.shortlist_status === 'in_progress')
  }, [summary?.shortlist_status])

  async function handleTrigger() {
    if (!selectedJobId) return
    try {
      setShouldPollSummary(true)
      const response = await triggerShortlisting(selectedJobId).unwrap()
      if (response.data.shortlist_status === 'in_progress') {
        toast.success(response.message)
      } else {
        setShouldPollSummary(false)
        toast.info(response.message)
      }
      void refetchSummary()
    } catch {
      setShouldPollSummary(false)
      toast.error('Unable to start screening right now.')
    }
  }

  async function handleStatus(applicationId: string, status: 'interview' | 'rejected') {
    try {
      await updateStatus({ application_id: applicationId, body: { status } }).unwrap()
      toast.success('Application updated.')
      void refetchApps()
    } catch {
      toast.error('Could not update application status.')
    }
  }

  async function handleFinalize() {
    if (!selectedJobId) return
    try {
      await finalizeShortlist({
        jobId: selectedJobId,
        use_ai_recommendations: true,
        threshold,
      }).unwrap()
      toast.success('Shortlist finalized.')
      void refetchSummary()
      void refetchApps()
    } catch {
      toast.error('Could not finalize shortlist.')
    }
  }

  // Show skeleton when:
  //  • jobs are still fetching (selectedJobId not yet auto-set from jobs[0])
  //  • selectedJobId is still '' (useEffect tick hasn't fired yet)
  //  • summary / apps queries are in flight after a job is selected
  const isLoadingContent = isLoadingJobs || !selectedJobId || isLoadingSummary || isLoadingApps


  return (
    <div className="dash-content container container--app-shell">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      {/* Static content: renders instantly, no skeleton needed */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Screening</h2>
          <p className="dash-page-header__subtitle">
            Run AI screening, review ranked candidates, and finalize the shortlist.
          </p>
        </div>
        <div className="dash-page-header__actions">
          {/* Job select: once jobs load we show the real select; before that, a subtle skeleton */}
          {isLoadingJobs ? (
            <div className="skeleton-block screening-skeleton__select" aria-hidden="true" />
          ) : (
            <select
              className="dash-select"
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="dashboard-overview-stack">
        {/* ── Shortlisting Status Card ───────────────────────────────────── */}
        {isLoadingContent ? (
          <ScreeningStatusCardSkeleton />
        ) : summary ? (
          <div className="dash-card">
            <div className="dash-card__body recruiter-summary__body">
              <div className="dash-card__title">Shortlisting Status</div>
              <div className="cell-actions">
                <span
                  className={`badge badge--${summary.shortlist_status === 'completed' ? 'success' : summary.shortlist_status === 'failed' ? 'danger' : summary.shortlist_status === 'in_progress' ? 'warning' : 'gray'}`}
                >
                  {summary.shortlist_status.replace('_', ' ')}
                </span>
                <span className="cell-muted">
                  {summary.scored}/{summary.total_applications} scored
                </span>
                {canRunScreening && (
                  <button
                    className="btn btn--primary btn--sm"
                    disabled={isTriggering}
                    onClick={() => void handleTrigger()}
                  >
                    {isTriggering ? 'Starting...' : 'Run AI screening'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Applications Table ─────────────────────────────────────────── */}
        {isLoadingContent || isFetchingApps ? (
          <ScreeningTableSkeleton rows={6} />
        ) : (
          <div className="dash-card">
            <div className="dash-card__body">
              {applications.length === 0 ? (
                <div className="profile-empty">No applications available for this job yet.</div>
              ) : (
                <div className="table-scroll">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Email</th>
                        <th>Score</th>
                        <th>Feedback</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((application) => (
                        <tr key={application.id}>
                          <td>{application.applicant_name}</td>
                          <td className="cell-meta">{application.applicant_email}</td>
                          <td>
                            <span className={`badge badge--${scoreBadgeClass(application.score)}`}>
                              {application.score == null ? 'Pending' : `${application.score}/100`}
                            </span>
                          </td>
                          <td className="cell-meta">{application.feedback ?? 'No feedback yet'}</td>
                          <td>{application.status}</td>
                          <td>
                            <div className="cell-actions">
                              <button
                                className="btn btn--outline btn--sm"
                                disabled={isUpdating}
                                onClick={() => void handleStatus(application.id, 'interview')}
                              >
                                Shortlist
                              </button>
                              <button
                                className="btn btn--ghost btn--danger btn--sm"
                                disabled={isUpdating}
                                onClick={() => void handleStatus(application.id, 'rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {summary?.shortlist_status === 'completed' && !summary.final_shortlist_completed ? (
          <div className="dash-card">
            <div className="dash-card__body recruiter-summary__body">
              <div className="dash-card__title">Finalize with AI recommendations</div>
              <div className="cell-actions">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value))}
                />
                <span className="cell-muted">Threshold: {threshold}</span>
                <button
                  className="btn btn--primary btn--sm"
                  disabled={isFinalizing}
                  onClick={() => void handleFinalize()}
                >
                  {isFinalizing ? 'Finalizing...' : 'Finalize shortlist'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
