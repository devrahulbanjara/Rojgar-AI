'use client'

import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import {
  useApproveDraftMutation,
  useGetDraftsQuery,
  usePrepareDraftsMutation,
  useSendAllDraftsMutation,
  useUpdateDraftMutation,
} from '@/store/services/outreachApi'

import {
  OutreachDraftDetailSkeleton,
  OutreachDraftListSkeleton,
} from './_components/OutreachSkeletons'

export default function RecruiterOutreachPage() {
  const { data: jobsResp, isLoading: isLoadingJobs } = useGetCompanyJobsQuery()
  const jobs = useMemo(() => jobsResp?.data ?? [], [jobsResp?.data])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [draftEdits, setDraftEdits] = useState<Record<string, { subject: string; body: string }>>(
    {},
  )

  const activeJobId = selectedJobId || jobs[0]?.id || ''

  const {
    data: draftsResp,
    refetch,
    isLoading: isLoadingDrafts,
    isFetching: isFetchingDrafts,
  } = useGetDraftsQuery(activeJobId, {
    skip: !activeJobId,
    pollingInterval: activeJobId ? 10000 : 0,
  })

  const drafts = useMemo(() => draftsResp?.data ?? [], [draftsResp?.data])
  const activeDraftId =
    selectedDraftId && drafts.some((draft) => draft.draft_id === selectedDraftId)
      ? selectedDraftId
      : (drafts[0]?.draft_id ?? null)
  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.draft_id === activeDraftId) ?? null,
    [drafts, activeDraftId],
  )
  const selectedDraftEdit = selectedDraft ? draftEdits[selectedDraft.draft_id] : undefined
  const draftSubject = selectedDraftEdit?.subject ?? selectedDraft?.subject ?? ''
  const draftBody = selectedDraftEdit?.body ?? selectedDraft?.body ?? ''

  const [prepareDrafts, { isLoading: isPreparing }] = usePrepareDraftsMutation()
  const [updateDraft, { isLoading: isSaving }] = useUpdateDraftMutation()
  const [approveDraft, { isLoading: isApproving }] = useApproveDraftMutation()
  const [sendAllDrafts, { isLoading: isSendingAll }] = useSendAllDraftsMutation()

  function updateSelectedDraftEdit(patch: Partial<{ subject: string; body: string }>) {
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

  async function handlePrepare() {
    if (!activeJobId) return
    try {
      const response = await prepareDrafts({ jobId: activeJobId }).unwrap()
      toast.success(response.message)
      void refetch()
    } catch {
      toast.error('Could not prepare drafts.')
    }
  }

  async function handleSave() {
    if (!selectedDraft) return
    try {
      await updateDraft({
        draftId: selectedDraft.draft_id,
        subject: draftSubject,
        body: draftBody,
      }).unwrap()
      toast.success('Draft updated.')
      void refetch()
    } catch {
      toast.error('Could not update draft.')
    }
  }

  async function handleApprove(approved: boolean) {
    if (!selectedDraft) return
    try {
      await approveDraft({ draftId: selectedDraft.draft_id, approved }).unwrap()
      toast.success(approved ? 'Draft approved.' : 'Draft discarded.')
      void refetch()
    } catch {
      toast.error('Could not process draft.')
    }
  }

  async function handleSendAll() {
    if (!activeJobId) return
    try {
      const response = await sendAllDrafts(activeJobId).unwrap()
      toast.success(response.message)
      void refetch()
    } catch {
      toast.error('Could not queue approved drafts.')
    }
  }

  const isLoadingContent = isLoadingJobs || !activeJobId || isLoadingDrafts || isFetchingDrafts

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Outreach</h2>
          <p className="dash-page-header__subtitle">
            Prepare, review, and send candidate communications job by job.
          </p>
        </div>
        <div className="dash-page-header__actions">
          {isLoadingJobs ? (
            <div className="skeleton-block outreach-skeleton__select" aria-hidden="true" />
          ) : (
            <select
              className="dash-select"
              value={activeJobId}
              onChange={(event) => {
                setSelectedJobId(event.target.value)
                setSelectedDraftId(null)
              }}
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn btn--outline btn--sm"
            disabled={isPreparing}
            onClick={() => void handlePrepare()}
          >
            {isPreparing ? 'Preparing...' : 'Prepare drafts'}
          </button>
          <button
            className="btn btn--primary btn--sm"
            disabled={isSendingAll}
            onClick={() => void handleSendAll()}
          >
            {isSendingAll ? 'Queueing...' : 'Send approved'}
          </button>
        </div>
      </div>

      <div className="dash-grid dash-grid--2col">
        {isLoadingContent ? (
          <OutreachDraftListSkeleton rows={5} />
        ) : (
          <div className="dash-card">
            <div className="dash-card__body dash-card__body--no-top">
              {drafts.length === 0 ? (
                <div className="profile-empty">No drafts yet for this job.</div>
              ) : (
                drafts.map((draft) => (
                  <button
                    key={draft.draft_id}
                    type="button"
                    className={`app-item${activeDraftId === draft.draft_id ? ' app-item--active' : ''}`}
                    onClick={() => setSelectedDraftId(draft.draft_id)}
                  >
                    <div className="app-item__body">
                      <div className="app-item__top">
                        <div className="app-item__role">{draft.candidate_name}</div>
                        <span
                          className={`badge badge--${draft.is_sent ? 'success' : draft.is_discarded ? 'danger' : draft.is_approved ? 'primary' : 'warning'}`}
                        >
                          {draft.is_sent
                            ? 'Sent'
                            : draft.is_discarded
                              ? 'Discarded'
                              : draft.is_approved
                                ? 'Approved'
                                : 'Review'}
                        </span>
                      </div>
                      <div className="app-item__company">{draft.subject ?? 'No subject yet'}</div>
                      <div className="app-item__meta">
                        <span>{draft.candidate_email}</span>
                        <span className="app-item__sep">·</span>
                        <span>Score {draft.score ?? 'N/A'}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {isLoadingContent ? (
          <OutreachDraftDetailSkeleton />
        ) : (
          <div className="dash-card">
            <div className="dash-card__body">
              {selectedDraft ? (
                <>
                  <div className="dash-card__title">{selectedDraft.candidate_name}</div>
                  <div className="dash-card__subtitle" style={{ marginBottom: '1rem' }}>
                    {selectedDraft.candidate_email}
                  </div>
                  <div className="resume-field">
                    <label className="resume-field__label">Subject</label>
                    <input
                      className="resume-field__input"
                      value={draftSubject}
                      onChange={(event) => updateSelectedDraftEdit({ subject: event.target.value })}
                    />
                  </div>
                  <div className="resume-field" style={{ marginTop: '1rem' }}>
                    <label className="resume-field__label">Body</label>
                    <textarea
                      className="resume-field__textarea"
                      rows={14}
                      value={draftBody}
                      onChange={(event) => updateSelectedDraftEdit({ body: event.target.value })}
                    />
                  </div>
                  <div className="cell-actions" style={{ marginTop: '1rem' }}>
                    <button
                      className="btn btn--outline btn--sm"
                      disabled={isSaving}
                      onClick={() => void handleSave()}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={isApproving}
                      onClick={() => void handleApprove(true)}
                    >
                      {isApproving ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      className="btn btn--ghost btn--danger btn--sm"
                      disabled={isApproving}
                      onClick={() => void handleApprove(false)}
                    >
                      Discard
                    </button>
                  </div>
                </>
              ) : (
                <div className="profile-empty">Select a draft to review.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
