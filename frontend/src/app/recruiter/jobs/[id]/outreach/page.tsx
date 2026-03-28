'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import {
  OutreachDraftDetailSkeleton,
  OutreachDraftListSkeleton,
} from '@/app/recruiter/outreach/_components/OutreachSkeletons'
import { getInitials } from '@/lib/mediaValidation'
import type { ApplicationStatus, RecruiterApplicationView } from '@/store/services/applicationsApi'
import { useGetJobApplicationsQuery } from '@/store/services/applicationsApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import type { EmailDraftRecord } from '@/store/services/outreachApi'
import {
  useApproveDraftMutation,
  useDeleteAllDraftsMutation,
  useDeleteDraftMutation,
  useGenerateDraftForApplicationMutation,
  useGetDraftsQuery,
  usePrepareDraftsMutation,
  useSendAllDraftsMutation,
  useUpdateDraftMutation,
} from '@/store/services/outreachApi'

import ButtonSpinner from '@/components/common/ButtonSpinner'
import MediaBadge from '@/components/common/MediaBadge'

import styles from './outreach.module.css'

type DraftEdit = {
  subject: string
  body: string
}

type CandidateItem = {
  application: RecruiterApplicationView
  draft: EmailDraftRecord | null
}

const WORKFLOW_STEPS = ['Job setup', 'Screening', 'Shortlisting', 'Outreach'] as const

function isDraftGeneratable(status: ApplicationStatus) {
  return status === 'screening' || status === 'rejected'
}

function getDerivedOutreachStatus(
  application: RecruiterApplicationView,
  options: { finalShortlistCompleted: boolean; shortlistThreshold: number },
): ApplicationStatus | null {
  if (
    application.status === 'screening' ||
    application.status === 'interview_booked' ||
    application.status === 'interview' ||
    application.status === 'offered' ||
    application.status === 'hired'
  ) {
    return 'screening'
  }

  if (application.status === 'rejected') {
    return 'rejected'
  }

  if (
    application.status === 'submitted' &&
    options.finalShortlistCompleted &&
    application.score != null &&
    application.feedback != null
  ) {
    return application.score >= options.shortlistThreshold ? 'screening' : 'rejected'
  }

  return null
}

function getApplicationTone(status: ApplicationStatus) {
  return status === 'rejected' ? 'danger' : 'success'
}

function getApplicationLabel(status: ApplicationStatus) {
  return status === 'rejected' ? 'Rejected' : 'Shortlisted'
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function buildEmailPreviewDocument(subject: string, body: string) {
  const previewBody = body?.trim()
    ? body
    : '<p style="margin:0;color:#64748b;font-family:Arial,sans-serif;">No email body yet.</p>'

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Email preview</title>
      </head>
      <body style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:720px;margin:0 auto;">
          <div style="margin-bottom:14px;padding:10px 14px;border:1px solid #dbe3ef;border-radius:14px;background:#ffffff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Subject</div>
            <div style="margin-top:6px;font-size:16px;font-weight:600;color:#0f172a;">
              ${subject?.trim() || 'No subject yet'}
            </div>
          </div>
          <div style="padding:24px;border:1px solid #dbe3ef;border-radius:18px;background:#ffffff;box-shadow:0 10px 30px rgba(15,23,42,0.06);overflow:hidden;">
            ${previewBody}
          </div>
        </div>
      </body>
    </html>
  `
}

export default function RecruiterJobOutreachPage() {
  const params = useParams<{ id: string }>()
  const jobId = typeof params.id === 'string' ? params.id : ''

  const { data: jobsResp, isLoading: isLoadingJobs } = useGetCompanyJobsQuery()
  const jobs = jobsResp?.data ?? []
  const activeJob = jobs.find((job) => job.id === jobId) ?? null

  const {
    data: applicationsResp,
    refetch: refetchApplications,
    isLoading: isLoadingApplications,
  } = useGetJobApplicationsQuery(
    { job_id: jobId, page: 1, size: 100 },
    {
      skip: !jobId,
      pollingInterval: jobId ? 10000 : 0,
    },
  )

  const {
    data: draftsResp,
    refetch: refetchDrafts,
    isLoading: isLoadingDrafts,
    isFetching: isFetchingDrafts,
  } = useGetDraftsQuery(jobId, {
    skip: !jobId,
    pollingInterval: jobId ? 10000 : 0,
  })

  const applications = useMemo(() => applicationsResp?.data ?? [], [applicationsResp?.data])
  const drafts = useMemo(() => draftsResp?.data ?? [], [draftsResp?.data])
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [expandedFeedbackApplicationId, setExpandedFeedbackApplicationId] = useState<string | null>(
    null,
  )
  const [draftEdits, setDraftEdits] = useState<Record<string, DraftEdit>>({})
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null)
  const [sendingDraftId, setSendingDraftId] = useState<string | null>(null)
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null)
  const [generatingApplicationId, setGeneratingApplicationId] = useState<string | null>(null)
  const [isGenerateMenuOpen, setIsGenerateMenuOpen] = useState(false)

  const [prepareDrafts, { isLoading: isPreparing }] = usePrepareDraftsMutation()
  const [generateDraftForApplication] = useGenerateDraftForApplicationMutation()
  const [updateDraft] = useUpdateDraftMutation()
  const [approveDraft] = useApproveDraftMutation()
  const [deleteDraft] = useDeleteDraftMutation()
  const [deleteAllDrafts, { isLoading: isDeletingAll }] = useDeleteAllDraftsMutation()
  const [sendAllDrafts, { isLoading: isSendingAll }] = useSendAllDraftsMutation()

  const visibleApplications = useMemo(() => {
    const shortlistThreshold = activeJob?.shortlist_threshold ?? 70
    const finalShortlistCompleted = activeJob?.final_shortlist_completed ?? false

    return [...applications]
      .filter((application) =>
        Boolean(
          getDerivedOutreachStatus(application, {
            finalShortlistCompleted,
            shortlistThreshold,
          }),
        ),
      )
      .sort((left, right) => {
        const leftStatus = getDerivedOutreachStatus(left, {
          finalShortlistCompleted,
          shortlistThreshold,
        })
        const rightStatus = getDerivedOutreachStatus(right, {
          finalShortlistCompleted,
          shortlistThreshold,
        })
        const leftPriority = leftStatus === 'rejected' ? 1 : 0
        const rightPriority = rightStatus === 'rejected' ? 1 : 0
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority
        }

        const leftScore = left.score ?? -1
        const rightScore = right.score ?? -1
        if (leftScore !== rightScore) {
          return rightScore - leftScore
        }

        return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      })
  }, [activeJob?.final_shortlist_completed, activeJob?.shortlist_threshold, applications])

  const draftByApplicationId = useMemo(
    () => new Map(drafts.map((draft) => [draft.application_id, draft])),
    [drafts],
  )

  const candidateItems = useMemo<CandidateItem[]>(
    () =>
      visibleApplications.map((application) => ({
        application,
        draft: draftByApplicationId.get(application.id) ?? null,
      })),
    [draftByApplicationId, visibleApplications],
  )

  useEffect(() => {
    if (!candidateItems.length) {
      setSelectedApplicationId(null)
      setExpandedFeedbackApplicationId(null)
      return
    }

    if (
      !selectedApplicationId ||
      !candidateItems.some((candidate) => candidate.application.id === selectedApplicationId)
    ) {
      setSelectedApplicationId(candidateItems[0].application.id)
    }
  }, [candidateItems, selectedApplicationId])

  const selectedCandidate =
    candidateItems.find((candidate) => candidate.application.id === selectedApplicationId) ??
    candidateItems[0] ??
    null
  const selectedDraft = selectedCandidate?.draft ?? null
  const selectedDraftEdit = selectedDraft ? draftEdits[selectedDraft.draft_id] : undefined
  const subjectValue = selectedDraftEdit?.subject ?? selectedDraft?.subject ?? ''
  const bodyValue = selectedDraftEdit?.body ?? selectedDraft?.body ?? ''
  const previewDocument = useMemo(
    () => buildEmailPreviewDocument(subjectValue, bodyValue),
    [bodyValue, subjectValue],
  )

  const candidatesReadyCount = candidateItems.length
  const savedDraftCount = drafts.length
  const pendingSendCount = useMemo(
    () => drafts.filter((draft) => !draft.is_sent && !draft.is_discarded).length,
    [drafts],
  )
  const sentCount = useMemo(() => drafts.filter((draft) => draft.is_sent).length, [drafts])
  const hasEligibleCandidates = candidatesReadyCount > 0
  const hasDrafts = savedDraftCount > 0
  const allSent =
    hasEligibleCandidates && candidateItems.every((candidate) => Boolean(candidate.draft?.is_sent))
  const hasUnsentDrafts = drafts.some((draft) => !draft.is_sent)
  const canSendAll = drafts.some((draft) => !draft.is_sent && !draft.is_discarded)

  function getDraftEdit(draft: EmailDraftRecord) {
    return (
      draftEdits[draft.draft_id] ?? {
        subject: draft.subject ?? '',
        body: draft.body ?? '',
      }
    )
  }

  function hasDraftChanged(draft: EmailDraftRecord) {
    const edit = getDraftEdit(draft)
    return edit.subject !== (draft.subject ?? '') || edit.body !== (draft.body ?? '')
  }

  function updateSelectedDraftEdit(patch: Partial<DraftEdit>) {
    if (!selectedDraft) return

    setDraftEdits((current) => ({
      ...current,
      [selectedDraft.draft_id]: {
        subject: current[selectedDraft.draft_id]?.subject ?? selectedDraft.subject ?? '',
        body: current[selectedDraft.draft_id]?.body ?? selectedDraft.body ?? '',
        ...patch,
      },
    }))
  }

  async function persistDraft(draft: EmailDraftRecord) {
    if (draft.is_sent || draft.is_discarded || !hasDraftChanged(draft)) return true

    const edit = getDraftEdit(draft)

    try {
      setSavingDraftId(draft.draft_id)
      await updateDraft({
        draftId: draft.draft_id,
        subject: edit.subject,
        body: edit.body,
      }).unwrap()
      setDraftEdits((current) => {
        const next = { ...current }
        delete next[draft.draft_id]
        return next
      })
      await Promise.all([refetchDrafts(), refetchApplications()])
      return true
    } catch {
      toast.error('Could not save draft changes.')
      return false
    } finally {
      setSavingDraftId(null)
    }
  }

  async function handlePrepare(directSend: boolean) {
    if (!jobId) return

    try {
      setIsGenerateMenuOpen(false)
      const response = await prepareDrafts({ jobId, direct_send: directSend }).unwrap()
      toast.success(directSend ? 'Drafts generated and queued to send.' : response.message)
      await Promise.all([refetchDrafts(), refetchApplications()])
    } catch {
      toast.error(directSend ? 'Could not generate and send drafts.' : 'Could not prepare drafts.')
    }
  }

  async function handleGenerateSingle(applicationId: string) {
    try {
      setGeneratingApplicationId(applicationId)
      await generateDraftForApplication(applicationId).unwrap()
      toast.success('Draft generated for this candidate.')
      setSelectedApplicationId(applicationId)
      await Promise.all([refetchDrafts(), refetchApplications()])
    } catch {
      toast.error('Could not generate a draft for this candidate.')
    } finally {
      setGeneratingApplicationId(null)
    }
  }

  async function handleSendSingle(draft: EmailDraftRecord) {
    try {
      if (hasDraftChanged(draft)) {
        const saved = await persistDraft(draft)
        if (!saved) return
      }

      setSendingDraftId(draft.draft_id)
      await approveDraft({ draftId: draft.draft_id, approved: true }).unwrap()
      toast.success('Email sent to this candidate.')
      await Promise.all([refetchDrafts(), refetchApplications()])
    } catch {
      toast.error('Could not send this email.')
    } finally {
      setSendingDraftId(null)
    }
  }

  async function handleDeleteDraft(draft: EmailDraftRecord) {
    try {
      setDeletingDraftId(draft.draft_id)
      await deleteDraft(draft.draft_id).unwrap()
      setDraftEdits((current) => {
        const next = { ...current }
        delete next[draft.draft_id]
        return next
      })
      toast.success('Draft deleted.')
      await Promise.all([refetchDrafts(), refetchApplications()])
    } catch {
      toast.error('Could not delete this draft.')
    } finally {
      setDeletingDraftId(null)
    }
  }

  async function handleDeleteAll() {
    if (!jobId) return

    const confirmed = window.confirm(
      'Delete every unsent draft for this job? You can generate them again later.',
    )
    if (!confirmed) return

    try {
      const response = await deleteAllDrafts(jobId).unwrap()
      toast.success(response.message)
      setDraftEdits({})
      await Promise.all([refetchDrafts(), refetchApplications()])
    } catch {
      toast.error('Could not delete all drafts.')
    }
  }

  async function handleSendAll() {
    if (!jobId) return

    try {
      const response = await sendAllDrafts(jobId).unwrap()
      toast.success(response.message)
      await Promise.all([refetchDrafts(), refetchApplications()])
    } catch {
      toast.error('Could not queue all drafts for sending.')
    }
  }

  const isLoadingContent = isLoadingJobs || isLoadingApplications || isLoadingDrafts
  const canEditSelectedDraft = selectedDraft
    ? !selectedDraft.is_sent && !selectedDraft.is_discarded
    : false
  const showJobMissingState = !isLoadingJobs && !activeJob
  const selectedOutreachStatus = selectedCandidate
    ? getDerivedOutreachStatus(selectedCandidate.application, {
        finalShortlistCompleted: activeJob?.final_shortlist_completed ?? false,
        shortlistThreshold: activeJob?.shortlist_threshold ?? 70,
      })
    : null
  const canGenerateSelectedDraft = selectedOutreachStatus
    ? isDraftGeneratable(selectedOutreachStatus)
    : false
  const selectedFeedback =
    selectedCandidate?.application.feedback?.trim() ||
    selectedDraft?.application_feedback?.trim() ||
    'No screening feedback available yet.'

  return (
    <div className="dash-content container container--app-shell">
      <div className={styles.page}>
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Outreach</h2>
            <p className="dash-page-header__subtitle">
              Generate, review, and send hiring updates to shortlisted and rejected candidates.
            </p>
          </div>
        </div>

        <section className={styles.contextCard}>
          <div className={styles.contextTop}>
            <div className={styles.contextCopy}>
              <div className="dash-card__title">{activeJob?.title ?? 'Loading job...'}</div>
              <div className="dash-card__subtitle">
                {activeJob
                  ? 'This is the final communication step after screening and shortlisting are complete.'
                  : 'Loading outreach context for this job.'}
              </div>
              <div className={styles.summaryPills}>
                <span className={`badge badge--secondary ${styles.pill}`}>
                  {candidatesReadyCount} candidate{candidatesReadyCount === 1 ? '' : 's'} ready
                </span>
                <span className={`badge badge--primary ${styles.pill}`}>
                  {savedDraftCount} draft{savedDraftCount === 1 ? '' : 's'}
                </span>
                <span className={`badge badge--warning ${styles.pill}`}>
                  {pendingSendCount} pending send
                </span>
                <span className={`badge badge--success ${styles.pill}`}>{sentCount} sent</span>
              </div>
            </div>

            <div className={styles.contextAside}>
              <div className={styles.contextMeta}>
                {activeJob ? (
                  <>
                    <span
                      className={`badge badge--${activeJob.final_shortlist_completed ? 'success' : 'warning'}`}
                    >
                      {activeJob.final_shortlist_completed
                        ? 'Shortlist finalized'
                        : 'Shortlist pending'}
                    </span>
                    <span
                      className={`badge badge--${activeJob.status === 'active' ? 'primary' : 'gray'}`}
                    >
                      {activeJob.status}
                    </span>
                  </>
                ) : null}
              </div>

              {!showJobMissingState ? (
                <div className={styles.headerActions}>
                  <Link href="/recruiter/screening" className="btn btn--outline btn--sm">
                    Back to screening
                  </Link>

                  {hasDrafts ? (
                    <div className={styles.generateMenuWrap}>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        disabled={isPreparing}
                        onClick={() => setIsGenerateMenuOpen((current) => !current)}
                      >
                        {isPreparing ? <ButtonSpinner label="Generating..." /> : 'Generate drafts'}
                      </button>
                      {isGenerateMenuOpen ? (
                        <div className={styles.generateMenu}>
                          <button
                            type="button"
                            className={styles.generateMenuItem}
                            disabled={isPreparing}
                            onClick={() => void handlePrepare(false)}
                          >
                            Review and send
                          </button>
                          <button
                            type="button"
                            className={styles.generateMenuItem}
                            disabled={isPreparing}
                            onClick={() => void handlePrepare(true)}
                          >
                            Direct send without review
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {hasUnsentDrafts ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--danger btn--sm"
                      disabled={isDeletingAll}
                      onClick={() => void handleDeleteAll()}
                    >
                      {isDeletingAll ? <ButtonSpinner label="Deleting..." /> : 'Delete all'}
                    </button>
                  ) : null}

                  {canSendAll ? (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={isSendingAll}
                      onClick={() => void handleSendAll()}
                    >
                      {isSendingAll ? <ButtonSpinner label="Queueing..." /> : 'Send all'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.summaryRow}>
            <div className={styles.workflowRail} aria-label="Hiring pipeline">
              {WORKFLOW_STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`${styles.workflowStep} ${index === 3 ? styles.workflowStepActive : ''}`}
                >
                  <span
                    className={`${styles.workflowDot} ${index === 3 ? styles.workflowDotActive : ''}`}
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                  {index < WORKFLOW_STEPS.length - 1 ? (
                    <span className={styles.workflowLine} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {showJobMissingState ? (
          <div className="dash-card">
            <div className="dash-card__body">
              <div className="dash-card__title">Job not found</div>
              <div className="dash-card__subtitle">
                This outreach route no longer matches a job in your company workspace.
              </div>
              <div className="cell-actions" style={{ marginTop: '1rem' }}>
                <Link href="/recruiter/jobs" className="btn btn--primary btn--sm">
                  Back to jobs
                </Link>
                <Link href="/recruiter/screening" className="btn btn--outline btn--sm">
                  Back to screening
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className={`dash-grid dash-grid--2col ${styles.workspaceGrid}`}>
            {isLoadingContent ? (
              <>
                <OutreachDraftListSkeleton rows={5} />
                <OutreachDraftDetailSkeleton />
              </>
            ) : !hasEligibleCandidates ? (
              <div className={`dash-card ${styles.singleStateCard}`}>
                <div className={`dash-card__body ${styles.centerState}`}>
                  <div className={styles.emptyTitle}>No candidates ready for outreach</div>
                  <p className={styles.emptyText}>
                    Once shortlisting finishes for this job, shortlisted and rejected candidates
                    will appear here for outreach.
                  </p>
                </div>
              </div>
            ) : !hasDrafts ? (
              <div className={`dash-card ${styles.singleStateCard}`}>
                <div className={`dash-card__body ${styles.centerState}`}>
                  <div className={styles.emptyTitle}>No drafts prepared yet</div>
                  <p className={styles.emptyText}>
                    Generate messages for all {candidatesReadyCount} candidate
                    {candidatesReadyCount === 1 ? '' : 's'}. You can either review them one by one
                    first or send them immediately without review.
                  </p>
                  <div className={styles.generateMenuWrap}>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={isPreparing}
                      onClick={() => setIsGenerateMenuOpen((current) => !current)}
                    >
                      {isPreparing ? <ButtonSpinner label="Generating..." /> : 'Generate drafts'}
                    </button>
                    {isGenerateMenuOpen ? (
                      <div className={styles.generateMenu}>
                        <button
                          type="button"
                          className={styles.generateMenuItem}
                          disabled={isPreparing}
                          onClick={() => void handlePrepare(false)}
                        >
                          Review and send
                        </button>
                        <button
                          type="button"
                          className={styles.generateMenuItem}
                          disabled={isPreparing}
                          onClick={() => void handlePrepare(true)}
                        >
                          Direct send without review
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : allSent ? (
              <div className={`dash-card ${styles.singleStateCard}`}>
                <div className="dash-card__header">
                  <div>
                    <div className="dash-card__title">Outreach sent</div>
                    <div className="dash-card__subtitle">
                      Every outreach email for this job has already been sent.
                    </div>
                  </div>
                </div>
                <div className={`dash-card__body dash-card__body--no-top ${styles.sentList}`}>
                  {candidateItems
                    .filter((candidate) => candidate.draft?.is_sent)
                    .map((candidate) => (
                      <div key={candidate.application.id} className={`app-item ${styles.sentRow}`}>
                        <div className="app-item__body">
                          <div className={styles.draftRow}>
                            <MediaBadge
                              src={candidate.application.applicant_avatar_url}
                              alt={candidate.application.applicant_name}
                              fallback={getInitials(candidate.application.applicant_name)}
                              className={styles.draftAvatar}
                              sizes="46px"
                            />
                            <div className={styles.draftBody}>
                              <div className={styles.draftTop}>
                                <div className={styles.draftName}>
                                  {candidate.application.applicant_name}
                                </div>
                                <span className="badge badge--success">Sent</span>
                              </div>
                              <div className={`app-item__meta ${styles.listMeta}`}>
                                <span className={styles.draftMetaText}>
                                  {candidate.application.applicant_email}
                                </span>
                                <span className="badge badge--gray">
                                  {getApplicationLabel(
                                    getDerivedOutreachStatus(candidate.application, {
                                      finalShortlistCompleted:
                                        activeJob?.final_shortlist_completed ?? false,
                                      shortlistThreshold: activeJob?.shortlist_threshold ?? 70,
                                    }) ?? 'rejected',
                                  )}
                                </span>
                                <span className="badge badge--gray">
                                  Sent {formatTimestamp(candidate.draft?.updated_at ?? '')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <>
                <div className={`dash-card ${styles.listCard}`}>
                  <div className="dash-card__header">
                    <div>
                      <div className="dash-card__title">Candidates</div>
                      <div className="dash-card__subtitle">
                        Shortlisted and rejected candidates for this job.
                      </div>
                    </div>
                    {isFetchingDrafts ? (
                      <span className="badge badge--gray">Refreshing</span>
                    ) : null}
                  </div>
                  <div className={`dash-card__body dash-card__body--no-top ${styles.listCardBody}`}>
                    {candidateItems.map((candidate) => (
                      <button
                        key={candidate.application.id}
                        type="button"
                        className={`app-item${
                          selectedCandidate?.application.id === candidate.application.id
                            ? ' app-item--active'
                            : ''
                        } ${styles.draftButton}`}
                        onClick={() => setSelectedApplicationId(candidate.application.id)}
                      >
                        <div className="app-item__body">
                          <div className={styles.draftRow}>
                            <MediaBadge
                              src={candidate.application.applicant_avatar_url}
                              alt={candidate.application.applicant_name}
                              fallback={getInitials(candidate.application.applicant_name)}
                              className={styles.draftAvatar}
                              sizes="46px"
                            />
                            <div className={styles.draftBody}>
                              <div className={styles.draftTop}>
                                <div className={styles.draftName}>
                                  {candidate.application.applicant_name}
                                </div>
                                <span
                                  className={`badge badge--${getApplicationTone(
                                    getDerivedOutreachStatus(candidate.application, {
                                      finalShortlistCompleted:
                                        activeJob?.final_shortlist_completed ?? false,
                                      shortlistThreshold: activeJob?.shortlist_threshold ?? 70,
                                    }) ?? 'rejected',
                                  )}`}
                                >
                                  {getApplicationLabel(
                                    getDerivedOutreachStatus(candidate.application, {
                                      finalShortlistCompleted:
                                        activeJob?.final_shortlist_completed ?? false,
                                      shortlistThreshold: activeJob?.shortlist_threshold ?? 70,
                                    }) ?? 'rejected',
                                  )}
                                </span>
                              </div>
                              <div className={styles.feedbackToggleRow}>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  className={styles.feedbackToggle}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedApplicationId(candidate.application.id)
                                    setExpandedFeedbackApplicationId((current) =>
                                      current === candidate.application.id
                                        ? null
                                        : candidate.application.id,
                                    )
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key !== 'Enter' && event.key !== ' ') return
                                    event.preventDefault()
                                    event.stopPropagation()
                                    setSelectedApplicationId(candidate.application.id)
                                    setExpandedFeedbackApplicationId((current) =>
                                      current === candidate.application.id
                                        ? null
                                        : candidate.application.id,
                                    )
                                  }}
                                >
                                  {expandedFeedbackApplicationId === candidate.application.id
                                    ? 'Hide feedback'
                                    : 'Show feedback'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {expandedFeedbackApplicationId === candidate.application.id ? (
                            <div className={styles.feedbackPanel}>
                              {candidate.application.feedback?.trim() ||
                                candidate.draft?.application_feedback?.trim() ||
                                'No screening feedback available yet.'}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`dash-card ${styles.detailCard}`}>
                  <div className="dash-card__header">
                    <div>
                      <div className="dash-card__title">
                        {selectedDraft ? 'Draft editor' : 'Candidate outreach'}
                      </div>
                      <div className="dash-card__subtitle">
                        {selectedDraft
                          ? 'Edit the HTML email and preview the final render before sending.'
                          : 'Generate a draft for the selected candidate or prepare drafts in bulk.'}
                      </div>
                    </div>
                  </div>
                  <div className={`dash-card__body ${styles.detailBody}`}>
                    {selectedCandidate ? (
                      <>
                        <div className={styles.detailTop}>
                          <div>
                            <div className="dash-card__title">
                              {selectedCandidate.application.applicant_name}
                            </div>
                            <div className={`dash-card__subtitle ${styles.detailHeaderMeta}`}>
                              <span>{selectedCandidate.application.applicant_email}</span>
                              <span
                                className={`badge badge--${getApplicationTone(
                                  selectedOutreachStatus ?? 'rejected',
                                )}`}
                              >
                                {getApplicationLabel(selectedOutreachStatus ?? 'rejected')}
                              </span>
                            </div>
                          </div>

                          <div className={styles.detailTopActions}>
                            {selectedDraft ? (
                              <>
                                {!selectedDraft.is_sent ? (
                                  <>
                                    {canGenerateSelectedDraft ? (
                                      <button
                                        type="button"
                                        className="btn btn--outline btn--sm"
                                        disabled={
                                          generatingApplicationId ===
                                          selectedCandidate.application.id
                                        }
                                        onClick={() =>
                                          void handleGenerateSingle(
                                            selectedCandidate.application.id,
                                          )
                                        }
                                      >
                                        {generatingApplicationId ===
                                        selectedCandidate.application.id ? (
                                          <ButtonSpinner label="Generating..." />
                                        ) : (
                                          'Regenerate'
                                        )}
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="btn btn--ghost btn--danger btn--sm"
                                      disabled={deletingDraftId === selectedDraft.draft_id}
                                      onClick={() => void handleDeleteDraft(selectedDraft)}
                                    >
                                      {deletingDraftId === selectedDraft.draft_id ? (
                                        <ButtonSpinner label="Deleting..." />
                                      ) : (
                                        'Delete draft'
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn--primary btn--sm"
                                      disabled={
                                        !canEditSelectedDraft ||
                                        sendingDraftId === selectedDraft.draft_id
                                      }
                                      onClick={() => void handleSendSingle(selectedDraft)}
                                    >
                                      {sendingDraftId === selectedDraft.draft_id ? (
                                        <ButtonSpinner label="Sending..." />
                                      ) : (
                                        'Send this candidate'
                                      )}
                                    </button>
                                  </>
                                ) : null}
                              </>
                            ) : canGenerateSelectedDraft ? (
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                disabled={
                                  generatingApplicationId === selectedCandidate.application.id
                                }
                                onClick={() =>
                                  void handleGenerateSingle(selectedCandidate.application.id)
                                }
                              >
                                {generatingApplicationId === selectedCandidate.application.id ? (
                                  <ButtonSpinner label="Generating..." />
                                ) : (
                                  'Generate draft for this candidate'
                                )}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className={styles.detailNotice}>
                          <strong>Screening feedback:</strong> {selectedFeedback}
                        </div>

                        {!selectedDraft ? (
                          <div className={`${styles.detailNotice} ${styles.detailNoticeMuted}`}>
                            {canGenerateSelectedDraft
                              ? 'No draft exists yet for this candidate. Generate one here or use the bulk generate action above.'
                              : 'This candidate has already moved beyond shortlisting, so a new outreach draft cannot be generated from here.'}
                          </div>
                        ) : selectedDraft.is_sent ? (
                          <div className={`${styles.detailNotice} ${styles.detailNoticeMuted}`}>
                            <div className={styles.sentState}>
                              <span className="badge badge--success">Sent</span>
                              <span className={styles.detailTimestamp}>
                                Sent on {formatTimestamp(selectedDraft.updated_at)}
                              </span>
                            </div>
                          </div>
                        ) : selectedDraft.is_discarded ? (
                          <div className={`${styles.detailNotice} ${styles.detailNoticeMuted}`}>
                            This draft was previously discarded. Generate it again if you want to
                            continue outreach for this candidate.
                          </div>
                        ) : (
                          <div className={`${styles.detailNotice} ${styles.detailNoticeMuted}`}>
                            Edit the HTML directly on the left. The preview on the right stays in
                            sync with your latest changes.
                          </div>
                        )}

                        {selectedDraft ? (
                          <>
                            <div className={styles.field}>
                              <label className={styles.fieldLabel} htmlFor="outreach-subject">
                                Subject
                              </label>
                              <input
                                id="outreach-subject"
                                className={styles.input}
                                value={subjectValue}
                                disabled={!canEditSelectedDraft}
                                onBlur={() => {
                                  if (selectedDraft) {
                                    void persistDraft(selectedDraft)
                                  }
                                }}
                                onChange={(event) =>
                                  updateSelectedDraftEdit({ subject: event.target.value })
                                }
                              />
                            </div>

                            <div className={styles.field}>
                              <label className={styles.fieldLabel} htmlFor="outreach-body">
                                HTML body
                              </label>
                              <div className={styles.editorPreviewGrid}>
                                <textarea
                                  id="outreach-body"
                                  className={styles.textarea}
                                  rows={16}
                                  value={bodyValue}
                                  disabled={!canEditSelectedDraft}
                                  onBlur={() => {
                                    if (selectedDraft) {
                                      void persistDraft(selectedDraft)
                                    }
                                  }}
                                  onChange={(event) =>
                                    updateSelectedDraftEdit({ body: event.target.value })
                                  }
                                />

                                <div className={styles.previewPane}>
                                  <div className={styles.previewPaneHeader}>Preview</div>
                                  <iframe
                                    title="Rendered email preview"
                                    className={styles.previewFrame}
                                    sandbox=""
                                    srcDoc={previewDocument}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className={styles.detailFooter}>
                              <div className={styles.helperText}>
                                {savingDraftId === selectedDraft.draft_id
                                  ? 'Saving draft changes...'
                                  : hasDraftChanged(selectedDraft)
                                    ? 'Unsaved changes'
                                    : selectedDraft.is_sent
                                      ? `Last updated ${formatTimestamp(selectedDraft.updated_at)}`
                                      : 'Changes save automatically when fields lose focus'}
                              </div>

                              <div className={styles.detailFooterActions}>
                                <button
                                  type="button"
                                  className="btn btn--outline btn--sm"
                                  disabled={
                                    !canEditSelectedDraft ||
                                    savingDraftId === selectedDraft.draft_id ||
                                    !hasDraftChanged(selectedDraft)
                                  }
                                  onClick={() => void persistDraft(selectedDraft)}
                                >
                                  {savingDraftId === selectedDraft.draft_id ? (
                                    <ButtonSpinner label="Saving..." />
                                  ) : (
                                    'Save draft'
                                  )}
                                </button>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
