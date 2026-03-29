'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import { useGetDraftsQuery } from '@/store/services/outreachApi'
import { Briefcase, CheckCircle2, Clock3, FileText, Mail, Send } from 'lucide-react'

import StatusPill from '@/components/common/StatusPill'

import { OutreachPageSkeleton } from './_components/OutreachSkeletons'
import styles from './outreach.module.css'

export default function RecruiterOutreachPage() {
  const { data, isLoading } = useGetCompanyJobsQuery()
  const jobs = useMemo(() => data?.data ?? [], [data?.data])
  const [jobScope, setJobScope] = useState<'finalized' | 'all'>('finalized')
  const [selectedJobId, setSelectedJobId] = useState('')

  const finalizedJobs = useMemo(
    () =>
      [...jobs]
        .filter((job) => job.final_shortlist_completed)
        .sort((left, right) => {
          if ((right.applications_count ?? 0) !== (left.applications_count ?? 0)) {
            return (right.applications_count ?? 0) - (left.applications_count ?? 0)
          }
          return left.title.localeCompare(right.title)
        }),
    [jobs],
  )

  const effectiveJobScope =
    jobScope === 'finalized' && finalizedJobs.length === 0 ? 'all' : jobScope
  const visibleJobs = useMemo(
    () => (effectiveJobScope === 'finalized' ? finalizedJobs : jobs),
    [effectiveJobScope, finalizedJobs, jobs],
  )

  const selectedJob = visibleJobs.find((job) => job.id === selectedJobId) ?? visibleJobs[0] ?? null

  const { data: draftsResp, isLoading: isLoadingDrafts } = useGetDraftsQuery(
    selectedJob?.id ?? '',
    {
      skip: !selectedJob?.id,
    },
  )

  const drafts = useMemo(() => draftsResp?.data ?? [], [draftsResp?.data])
  const pendingDrafts = drafts.filter(
    (draft) => !draft.is_sent && !draft.is_discarded && !draft.is_approved,
  ).length
  const approvedDrafts = drafts.filter(
    (draft) => draft.is_approved && !draft.is_sent && !draft.is_discarded,
  ).length
  const sentDrafts = drafts.filter((draft) => draft.is_sent).length
  const canOpenWorkspace = Boolean(selectedJob?.final_shortlist_completed || drafts.length > 0)
  const totalCandidates = selectedJob?.applications_count ?? 0
  const activeStepKey = !canOpenWorkspace
    ? 'generate'
    : pendingDrafts > 0
      ? 'review'
      : approvedDrafts > 0
        ? 'send'
        : null

  const pipelineSteps = [
    {
      key: 'generate',
      title: 'Generate Drafts',
      count: totalCandidates,
      meta: 'Candidates ready to enter outreach',
      icon: FileText,
    },
    {
      key: 'review',
      title: 'Review & Edit',
      count: isLoadingDrafts ? '...' : pendingDrafts,
      meta: 'Drafts waiting for recruiter review',
      icon: Clock3,
    },
    {
      key: 'approve',
      title: 'Approve',
      count: isLoadingDrafts ? '...' : approvedDrafts,
      meta: 'Approved drafts prepared for final sending',
      icon: CheckCircle2,
    },
    {
      key: 'send',
      title: 'Send',
      count: isLoadingDrafts ? '...' : sentDrafts,
      meta: 'Emails already sent for this job',
      icon: Send,
    },
  ]

  if (isLoading) {
    return <OutreachPageSkeleton />
  }

  if (jobs.length === 0) {
    return (
      <div className={`dash-content container container--app-shell ${styles.outreachPage}`}>
        <div className={styles.emptyState}>
          Create a job first, then finish shortlisting to prepare candidate outreach.
          <div className={styles.emptyActions}>
            <Link href="/recruiter/jobs" className="btn btn--primary btn--sm">
              Open jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`dash-content container container--app-shell ${styles.outreachPage}`}>
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Outreach</h2>
          <p className="dash-page-header__subtitle">
            Review finalized jobs, track draft progress, and open the outreach workspace.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className="badge badge--gray">
            <Briefcase size={13} aria-hidden="true" />
            {visibleJobs.length} job{visibleJobs.length === 1 ? '' : 's'}
          </span>
          {selectedJob ? (
            <span className="badge badge--secondary">
              <Mail size={13} aria-hidden="true" />
              {drafts.length} draft{drafts.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.contextBar}>
        <div className={styles.contextTop}>
          <div className={styles.selectorRow}>
            <label className={`${styles.selectWrap} ${styles.selectWrapView}`}>
              <span className={styles.selectLabel}>View</span>
              <select
                className={styles.select}
                value={jobScope}
                onChange={(event) =>
                  setJobScope(event.target.value === 'all' ? 'all' : 'finalized')
                }
              >
                <option value="finalized">Finalized jobs</option>
                <option value="all">All jobs</option>
              </select>
            </label>

            <label className={`${styles.selectWrap} ${styles.selectWrapJob}`}>
              <span className={styles.selectLabel}>Job</span>
              <select
                className={styles.select}
                value={selectedJob?.id ?? ''}
                onChange={(event) => setSelectedJobId(event.target.value)}
              >
                {visibleJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                    {job.final_shortlist_completed ? ' - finalized' : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.actionCluster}>
              <Link href="/recruiter/screening" className="btn btn--outline btn--sm">
                Back to screening
              </Link>
              {selectedJob ? (
                <Link
                  href={`/recruiter/jobs/${selectedJob.id}/outreach`}
                  className="btn btn--primary btn--sm"
                >
                  Open outreach workspace
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {selectedJob ? (
          <div className={styles.contextMeta}>
            <div className={styles.statusList}>
              <span className={`badge badge--primary ${styles.statusItem}`}>
                <span className={styles.statusLabel}>Outreach Scope:</span>
                <span className={styles.statusValue}>
                  {effectiveJobScope === 'finalized' ? 'Finalized only' : 'All jobs'}
                </span>
              </span>
              <span
                className={`badge badge--${canOpenWorkspace ? 'success' : 'gray'} ${styles.statusItem}`}
              >
                <span className={styles.statusLabel}>Shortlisting:</span>
                <span className={styles.statusValue}>
                  {canOpenWorkspace ? 'Finalized' : 'Pending'}
                </span>
              </span>
              <span className={styles.statusItem}>
                <span className={styles.statusLabel}>Job Status:</span>
                <StatusPill kind="job" status={selectedJob.status} />
              </span>
              <span
                className={`badge badge--${canOpenWorkspace ? 'success' : 'warning'} ${styles.statusItem}`}
              >
                <span className={styles.statusLabel}>Workspace:</span>
                <span className={styles.statusValue}>
                  {canOpenWorkspace ? 'Ready' : 'Waiting for shortlist'}
                </span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {selectedJob ? (
        <section className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <div>
              <div className={styles.previewTitle}>Job Outreach Status</div>
              <div className={styles.previewSubtitle}>
                {canOpenWorkspace
                  ? `${selectedJob.title} is ready for recruiter outreach and candidate communication.`
                  : `${selectedJob.title} still needs shortlisting to finish before outreach can move forward.`}
              </div>
            </div>
          </div>

          <div className={styles.flowPanel}>
            <div className={styles.flowSteps}>
              {pipelineSteps.map((step) => {
                const Icon = step.icon
                const isActive = step.key === activeStepKey

                return (
                  <div
                    key={step.key}
                    className={`${styles.flowStep} ${isActive ? styles.flowStepActive : ''}`}
                  >
                    <span className={styles.flowIcon}>
                      <span className={styles.flowDot} aria-hidden="true" />
                    </span>
                    <div className={styles.flowBody}>
                      <div className={styles.flowRow}>
                        <Icon size={16} aria-hidden="true" />
                        <span className={styles.flowHeading}>{step.title}</span>
                        <span className={styles.flowCountBadge}>{step.count}</span>
                      </div>
                      <div className={styles.flowMeta}>{step.meta}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={styles.flowFooter}>
              <div className={styles.flowFooterCopy}>
                {canOpenWorkspace
                  ? approvedDrafts > 0
                    ? 'Approved drafts are ready to send from the workspace.'
                    : 'Open the workspace to review, edit, approve, and send candidate outreach.'
                  : 'Finish shortlisting first so outreach can generate and manage candidate drafts.'}
              </div>
              <div className={styles.flowFooterBadge}>
                <span className={`badge badge--gray ${styles.statPill}`}>
                  <strong>{drafts.length}</strong> total drafts
                </span>
              </div>
            </div>
          </div>

          {jobScope === 'finalized' && finalizedJobs.length === 0 ? (
            <div className={styles.helperNote}>
              No finalized jobs were returned right now, so the view automatically switched to all
              jobs.
            </div>
          ) : null}
        </section>
      ) : (
        <div className={styles.emptyState}>Select a job to open its outreach summary.</div>
      )}
    </div>
  )
}
