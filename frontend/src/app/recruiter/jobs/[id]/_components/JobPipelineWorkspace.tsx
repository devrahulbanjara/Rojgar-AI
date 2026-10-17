'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { notify } from '@/lib/notify'
import { useAppSelector } from '@/store/hooks'
import {
  type ApplicationStatus,
  useGetMyCompanyCandidatesQuery,
  useUpdateApplicationStatusMutation,
} from '@/store/services/applicationsApi'
import { useGetMyCompanyQuery } from '@/store/services/companyApi'
import {
  type EmailDraftRecord,
  useApproveDraftMutation,
  useDeleteAllDraftsMutation,
  useGenerateDraftForApplicationMutation,
  useGetDraftsQuery,
  usePrepareDraftsMutation,
  useSendAllDraftsMutation,
} from '@/store/services/outreachApi'
import {
  useEvaluateSingleApplicationMutation,
  useFinalizeShortlistMutation,
  useGetShortlistSummaryQuery,
} from '@/store/services/shortlistingApi'
import { Bot, Check, RefreshCw, Send, X } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import CandidateDrawer, {
  type DrawerTab,
  resolveDrawerTab,
} from '@/components/recruiter/CandidateDrawer/CandidateDrawer'

import styles from './JobPipelineWorkspace.module.scss'

const STAGES: Array<{ id: PipelineStage; label: string; statuses: ApplicationStatus[] }> = [
  { id: 'applied', label: 'Applied', statuses: ['applied'] },
  { id: 'shortlist', label: 'Shortlist', statuses: ['shortlisted'] },
  {
    id: 'interview',
    label: 'Interview',
    statuses: ['interview_booked', 'interview_completed'],
  },
  { id: 'offer', label: 'Offer', statuses: ['offer', 'offer_accepted', 'offer_declined'] },
  { id: 'rejected', label: 'Rejected', statuses: ['rejected'] },
]

type PipelineStage = 'applied' | 'shortlist' | 'interview' | 'offer' | 'rejected'

const STAGE_IDS = STAGES.map((stage) => stage.id) as readonly string[]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function scoreClass(score: number | null) {
  if (score === null) return styles.scoreNone
  if (score >= 75) return styles.scoreGood
  if (score >= 50) return styles.scoreOkay
  return styles.scoreLow
}

export default function JobPipelineWorkspace({ jobId }: { jobId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const stageParam = searchParams.get('stage')
  const activeStage: PipelineStage = STAGE_IDS.includes(stageParam ?? '')
    ? (stageParam as PipelineStage)
    : 'applied'

  const drawerAppId = searchParams.get('app')
  const drawerTabParam = searchParams.get('tab')
  const drawerTab = resolveDrawerTab(drawerTabParam, 'profile')

  const updateParams = useCallback(
    (next: { stage?: PipelineStage; app?: string | null; tab?: DrawerTab | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.stage !== undefined) params.set('stage', next.stage)
      if (next.app !== undefined) {
        if (next.app) {
          params.set('app', next.app)
        } else {
          params.delete('app')
        }
      }
      if (next.tab !== undefined) {
        if (next.tab) {
          params.set('tab', next.tab)
        } else {
          params.delete('tab')
        }
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const setStage = useCallback((stage: PipelineStage) => updateParams({ stage }), [updateParams])
  const openDrawer = useCallback(
    (applicationId: string, tab?: DrawerTab) =>
      updateParams({ app: applicationId, tab: tab ?? null }),
    [updateParams],
  )
  const closeDrawer = useCallback(() => updateParams({ app: null, tab: null }), [updateParams])
  const setDrawerTab = useCallback((tab: DrawerTab) => updateParams({ tab }), [updateParams])

  const { data, isLoading, isError, refetch } = useGetMyCompanyCandidatesQuery({
    page: 1,
    size: 200,
  })

  const candidates = useMemo(() => data?.data ?? [], [data?.data])

  // Optimistic status overrides so a decision moves the row instantly.
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, ApplicationStatus>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [updateStatus] = useUpdateApplicationStatusMutation()

  // Flatten applications for this job, with candidate metadata attached.
  const jobApplications = useMemo(() => {
    const rows: Array<{
      application_id: string
      candidate_id: string
      applicant_name: string
      applicant_email: string | null
      applicant_avatar_url: string | null
      job_id: string
      job_title: string
      status: ApplicationStatus
      score: number | null
      strengths: string[] | null
      weaknesses: string[] | null
      created_at: string
    }> = []
    candidates.forEach((candidate) => {
      candidate.applications
        .filter((application) => application.job_id === jobId)
        .forEach((application) => {
          rows.push({
            application_id: application.application_id,
            candidate_id: candidate.candidate_id,
            applicant_name: candidate.applicant_name,
            applicant_email: candidate.applicant_email,
            applicant_avatar_url: candidate.applicant_avatar_url,
            job_id: application.job_id,
            job_title: application.job_title,
            status: optimisticStatus[application.application_id] ?? application.status,
            score: application.score,
            strengths: application.strengths,
            weaknesses: application.weaknesses,
            created_at: application.created_at,
          })
        })
    })
    return rows
  }, [candidates, jobId, optimisticStatus])

  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {
      applied: 0,
      shortlist: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    }
    jobApplications.forEach((row) => {
      const matchedStage = STAGES.find((stage) => stage.statuses.includes(row.status))
      if (matchedStage) counts[matchedStage.id] += 1
    })
    return counts
  }, [jobApplications])

  const visibleStage = STAGES.find((stage) => stage.id === activeStage) ?? STAGES[0]
  const visibleApplications = useMemo(
    () =>
      jobApplications
        .filter((row) => visibleStage.statuses.includes(row.status))
        .sort((a, b) => {
          // Applied: best AI match first so the recruiter decides top-down.
          if (visibleStage.id === 'applied' && a.score !== b.score) {
            return (b.score ?? -1) - (a.score ?? -1)
          }
          return b.created_at.localeCompare(a.created_at)
        }),
    [jobApplications, visibleStage],
  )
  const visibleIds = useMemo(
    () => visibleApplications.map((row) => row.application_id),
    [visibleApplications],
  )
  const selectedVisibleIds = visibleIds.filter((id) => selectedIds.has(id))

  const toggleSelected = useCallback((applicationId: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(applicationId)) next.delete(applicationId)
      else next.add(applicationId)
      return next
    })
  }, [])

  const decide = useCallback(
    async (applicationIds: string[], status: 'shortlisted' | 'rejected') => {
      if (applicationIds.length === 0) return
      setOptimisticStatus((previous) => ({
        ...previous,
        ...Object.fromEntries(applicationIds.map((id) => [id, status])),
      }))
      setSelectedIds(new Set())
      const results = await Promise.allSettled(
        applicationIds.map((id) => updateStatus({ application_id: id, body: { status } }).unwrap()),
      )
      const failed = applicationIds.filter((_, index) => results[index].status === 'rejected')
      const label = status === 'shortlisted' ? 'Shortlisted' : 'Rejected'
      if (failed.length > 0) {
        notify.error(
          `Could not update ${failed.length} candidate${failed.length === 1 ? '' : 's'}.`,
        )
      } else {
        notify.success(
          applicationIds.length === 1
            ? `${label}.`
            : `${label} ${applicationIds.length} candidates.`,
        )
      }
      await refetch()
      setOptimisticStatus((previous) => {
        const next = { ...previous }
        applicationIds.forEach((id) => delete next[id])
        return next
      })
    },
    [refetch, updateStatus],
  )

  // ── AI evaluation summary + bulk-approve wiring ──────────────────────────
  const isAppliedStage = activeStage === 'applied'
  const { data: summaryResp } = useGetShortlistSummaryQuery(jobId, { skip: !isAppliedStage })
  const summary = summaryResp?.data
  const threshold = summary?.shortlist_threshold ?? null

  const screeningStats = useMemo(() => {
    const pending = jobApplications.filter((row) => row.status === 'applied')
    const scored = pending.filter((row) => row.score !== null)
    const above =
      threshold === null ? 0 : scored.filter((row) => (row.score ?? 0) >= threshold).length
    const below =
      threshold === null ? 0 : scored.filter((row) => (row.score ?? 0) < threshold).length
    return {
      pending: pending.length,
      scored: scored.length,
      above,
      below,
      awaiting: pending.length - scored.length,
    }
  }, [jobApplications, threshold])

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [finalizeShortlist, { isLoading: isFinalizing }] = useFinalizeShortlistMutation()
  const [approvedKey, setApprovedKey] = useState<string | null>(null)
  const currentKey = `${jobId}:${activeStage}`
  const showOutreachCta = approvedKey === currentKey

  // ── Outreach (post-shortlist) summary + bulk actions ─────────────────────
  const isPostShortlistStage = activeStage === 'shortlist' || activeStage === 'rejected'
  const { data: draftsResp, refetch: refetchDrafts } = useGetDraftsQuery(jobId, {
    skip: !isPostShortlistStage,
  })
  const drafts = useMemo(() => draftsResp?.data ?? [], [draftsResp?.data])
  const draftByApp = useMemo(
    () => new Map(drafts.map((draft) => [draft.application_id, draft])),
    [drafts],
  )

  const outreachStats = useMemo(() => {
    let drafted = 0
    let approved = 0
    let sent = 0
    let discarded = 0
    let missing = 0
    visibleApplications.forEach((row) => {
      const draft = draftByApp.get(row.application_id)
      if (!draft) {
        missing += 1
        return
      }
      if (draft.is_sent) sent += 1
      else if (draft.is_discarded) discarded += 1
      else if (draft.is_approved) approved += 1
      else drafted += 1
    })
    return {
      cohort: visibleApplications.length,
      drafted,
      approved,
      sent,
      discarded,
      missing,
    }
  }, [visibleApplications, draftByApp])

  // Shortlist emails include the company's booking link; the backend rejects
  // them without one, so say so up front instead of failing after the click.
  const isAdmin = useAppSelector((s) => s.auth.user?.primary_role === 'recruiter_admin')
  const { data: companyResp } = useGetMyCompanyQuery(undefined, {
    skip: activeStage !== 'shortlist',
  })
  const missingBookingLink =
    activeStage === 'shortlist' && Boolean(companyResp?.data) && !companyResp?.data?.cal_booking_url

  const sendable = outreachStats.drafted + outreachStats.approved
  const allOutreachComplete =
    outreachStats.cohort > 0 && outreachStats.sent === outreachStats.cohort

  type OutreachConfirm = 'trustAI' | 'sendAll' | 'discardAll' | null
  const [outreachConfirm, setOutreachConfirm] = useState<OutreachConfirm>(null)
  const [rowActionId, setRowActionId] = useState<string | null>(null)
  const [prepareDrafts, { isLoading: isPreparing }] = usePrepareDraftsMutation()
  const [sendAllDrafts, { isLoading: isSendingAll }] = useSendAllDraftsMutation()
  const [deleteAllDrafts, { isLoading: isDeletingAll }] = useDeleteAllDraftsMutation()
  const [approveDraft] = useApproveDraftMutation()
  const [generateDraftForApplication] = useGenerateDraftForApplicationMutation()
  const [evaluateSingle] = useEvaluateSingleApplicationMutation()
  const [evaluatingAppId, setEvaluatingAppId] = useState<string | null>(null)

  async function handleEvaluateSingle(applicationId: string) {
    setEvaluatingAppId(applicationId)
    try {
      const response = await evaluateSingle(applicationId).unwrap()
      notify.success(`Evaluated with score ${response.data.score ?? '—'}.`)
      await refetch()
    } catch {
      notify.error('Could not evaluate this candidate.')
    } finally {
      setEvaluatingAppId(null)
    }
  }

  useEffect(() => {
    if (!isConfirmOpen && outreachConfirm === null) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setIsConfirmOpen(false)
      setOutreachConfirm(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [isConfirmOpen, outreachConfirm])

  const canApprove =
    isAppliedStage &&
    threshold !== null &&
    screeningStats.scored > 0 &&
    !summary?.final_shortlist_completed

  async function handleApproveAll() {
    try {
      const response = await finalizeShortlist({
        jobId,
        use_ai_recommendations: true,
      }).unwrap()
      setIsConfirmOpen(false)
      setApprovedKey(currentKey)
      notify.success(
        `Approved ${response.data.updated_applications} AI recommendation${
          response.data.updated_applications === 1 ? '' : 's'
        }.`,
      )
      await refetch()
    } catch {
      notify.error('Could not approve AI recommendations.')
    }
  }

  async function handleGenerateDrafts(directSend: boolean) {
    setOutreachConfirm(null)
    try {
      await prepareDrafts({ jobId, direct_send: directSend }).unwrap()
      notify.success(
        directSend
          ? 'Drafts generated and queued to send.'
          : 'Drafts generated. Review before sending.',
      )
      await Promise.all([refetch(), refetchDrafts()])
    } catch {
      notify.error(
        directSend ? 'Could not generate and send drafts.' : 'Could not generate drafts.',
      )
    }
  }

  async function handleSendAll() {
    setOutreachConfirm(null)
    try {
      await sendAllDrafts(jobId).unwrap()
      notify.success('Emails queued for sending.')
      await Promise.all([refetch(), refetchDrafts()])
    } catch {
      notify.error('Could not send emails.')
    }
  }

  async function handleDiscardAll() {
    setOutreachConfirm(null)
    try {
      await deleteAllDrafts(jobId).unwrap()
      notify.success('Drafts discarded.')
      await Promise.all([refetch(), refetchDrafts()])
    } catch {
      notify.error('Could not discard drafts.')
    }
  }

  async function handleRowSend(draft: EmailDraftRecord) {
    setRowActionId(draft.application_id)
    try {
      await approveDraft({ draftId: draft.draft_id, approved: true }).unwrap()
      notify.success('Email sent.')
      await Promise.all([refetch(), refetchDrafts()])
    } catch {
      notify.error('Could not send this email.')
    } finally {
      setRowActionId(null)
    }
  }

  async function handleRowRegenerate(applicationId: string) {
    setRowActionId(applicationId)
    try {
      await generateDraftForApplication(applicationId).unwrap()
      notify.success('Draft generated.')
      await Promise.all([refetch(), refetchDrafts()])
    } catch {
      notify.error('Could not generate a draft for this candidate.')
    } finally {
      setRowActionId(null)
    }
  }

  function getOutreachPill(draft: EmailDraftRecord | undefined) {
    if (!draft) {
      return { label: 'Pending', className: styles.outreachPillMissing }
    }
    if (draft.is_sent) {
      return { label: 'Sent', className: styles.outreachPillSent }
    }
    if (draft.is_discarded) {
      return { label: 'Discarded', className: styles.outreachPillDiscarded }
    }
    if (draft.is_approved) {
      return { label: 'Approved', className: styles.outreachPillApproved }
    }
    return { label: 'Drafted', className: styles.outreachPillDrafted }
  }

  return (
    <div>
      <div className={styles.tabBar} role="tablist" aria-label="Pipeline stages">
        {STAGES.map((stage) => {
          const isActive = stage.id === activeStage
          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => setStage(stage.id)}
            >
              {stage.label}
              <span className={styles.tabCount}>{stageCounts[stage.id]}</span>
            </button>
          )
        })}
      </div>

      {isAppliedStage && threshold !== null && screeningStats.pending > 0 ? (
        <div
          className={styles.evaluationBar}
          title={
            showOutreachCta
              ? 'Statuses updated. Generate outreach emails next.'
              : `Score ≥ ${threshold} → Shortlisted · Score < ${threshold} → Rejected · Manual moves left alone`
          }
        >
          <span className={styles.evaluationBarEyebrow}>Initial AI screening</span>
          {showOutreachCta ? (
            <span className={styles.evaluationBarText}>Recommendations applied</span>
          ) : (
            <>
              <span className={styles.evaluationBarText}>
                <strong>{screeningStats.scored}</strong> of {screeningStats.pending} ready
              </span>
              <span className={styles.evaluationBarSep} aria-hidden="true">
                ·
              </span>
              <span
                className={`${styles.evaluationBarChip} ${styles.evaluationBarChipGood}`}
                title={`Ready to shortlist (≥ ${threshold})`}
              >
                ✓ {screeningStats.above}
              </span>
              <span
                className={`${styles.evaluationBarChip} ${styles.evaluationBarChipBad}`}
                title={`Ready to reject (< ${threshold})`}
              >
                ✗ {screeningStats.below}
              </span>
              {screeningStats.awaiting > 0 ? (
                <span
                  className={`${styles.evaluationBarChip} ${styles.evaluationBarChipMuted}`}
                  title="Still being scored"
                >
                  … {screeningStats.awaiting}
                </span>
              ) : null}
            </>
          )}
          <span className={styles.evaluationBarSpacer} />
          {showOutreachCta ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setStage('shortlist')}
            >
              Draft outreach
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn--primary btn--sm${isFinalizing ? ' btn--loading' : ''}`}
              disabled={!canApprove || isFinalizing}
              onClick={() => setIsConfirmOpen(true)}
            >
              {isFinalizing
                ? 'Approving...'
                : screeningStats.scored > 0
                  ? `Approve ${screeningStats.scored}`
                  : 'Waiting for scores'}
            </button>
          )}
        </div>
      ) : null}

      {missingBookingLink && outreachStats.cohort > 0 ? (
        <div className={styles.evaluationBar} role="status">
          <span className={styles.evaluationBarText}>
            Add an interview booking link before emailing shortlisted candidates.
          </span>
          <span className={styles.evaluationBarSpacer} />
          {isAdmin ? (
            <Link href="/recruiter/company/settings" className="btn btn--primary btn--sm">
              Add booking link
            </Link>
          ) : (
            <span className={styles.evaluationBarText}>Ask your company admin.</span>
          )}
        </div>
      ) : null}

      {isPostShortlistStage && outreachStats.cohort > 0 && !missingBookingLink ? (
        <div
          className={styles.evaluationBar}
          title={
            allOutreachComplete
              ? 'All emails sent for this cohort.'
              : activeStage === 'shortlist'
                ? 'Shortlist emails include the booking link from your company settings.'
                : 'Rejection emails do not include a booking link.'
          }
        >
          <span className={styles.evaluationBarEyebrow}>Outreach</span>
          {allOutreachComplete ? (
            <span className={styles.evaluationBarText}>
              Complete · <strong>{outreachStats.sent}</strong> sent
            </span>
          ) : (
            <>
              <span className={styles.evaluationBarText}>
                <strong>{outreachStats.cohort - outreachStats.missing}</strong> of{' '}
                {outreachStats.cohort} drafted
              </span>
              {outreachStats.sent > 0 ||
              outreachStats.drafted + outreachStats.approved > 0 ||
              outreachStats.discarded > 0 ||
              outreachStats.missing > 0 ? (
                <span className={styles.evaluationBarSep} aria-hidden="true">
                  ·
                </span>
              ) : null}
              {outreachStats.sent > 0 ? (
                <span
                  className={`${styles.evaluationBarChip} ${styles.evaluationBarChipGood}`}
                  title="Already sent"
                >
                  📧 {outreachStats.sent}
                </span>
              ) : null}
              {outreachStats.drafted + outreachStats.approved > 0 ? (
                <span
                  className={`${styles.evaluationBarChip} ${styles.evaluationBarChipMuted}`}
                  title="Drafted, awaiting send"
                >
                  ✏ {outreachStats.drafted + outreachStats.approved}
                </span>
              ) : null}
              {outreachStats.missing > 0 ? (
                <span
                  className={`${styles.evaluationBarChip} ${styles.evaluationBarChipMuted}`}
                  title="No draft yet"
                >
                  … {outreachStats.missing}
                </span>
              ) : null}
              {outreachStats.discarded > 0 ? (
                <span
                  className={`${styles.evaluationBarChip} ${styles.evaluationBarChipBad}`}
                  title="Discarded"
                >
                  ✗ {outreachStats.discarded}
                </span>
              ) : null}
            </>
          )}
          <span className={styles.evaluationBarSpacer} />
          {!allOutreachComplete ? (
            <>
              {outreachStats.missing > 0 ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={isPreparing}
                  onClick={() => setOutreachConfirm('trustAI')}
                >
                  Generate &amp; send
                </button>
              ) : null}
              {sendable > 0 ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={isDeletingAll}
                  onClick={() => setOutreachConfirm('discardAll')}
                >
                  Discard
                </button>
              ) : null}
              {outreachStats.missing > 0 ? (
                <button
                  type="button"
                  className={`btn btn--primary btn--sm${isPreparing ? ' btn--loading' : ''}`}
                  disabled={isPreparing}
                  onClick={() => void handleGenerateDrafts(false)}
                >
                  {isPreparing ? 'Generating...' : `Generate ${outreachStats.missing}`}
                </button>
              ) : sendable > 0 ? (
                <button
                  type="button"
                  className={`btn btn--primary btn--sm${isSendingAll ? ' btn--loading' : ''}`}
                  disabled={isSendingAll}
                  onClick={() => setOutreachConfirm('sendAll')}
                >
                  {isSendingAll ? 'Sending...' : `Send ${sendable}`}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className={styles.loadingSkeleton}>
          <div />
          <div />
          <div />
        </div>
      ) : isError ? (
        <div className={styles.empty}>
          Failed to load applicants.{' '}
          <button className="btn btn--ghost btn--sm" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      ) : visibleApplications.length === 0 ? (
        <div className={styles.empty}>No candidates in this stage yet.</div>
      ) : (
        <div className={styles.list}>
          {isAppliedStage ? (
            <div className={styles.bulkBar} aria-live="polite">
              <span
                role="checkbox"
                tabIndex={0}
                aria-checked={
                  selectedVisibleIds.length === 0
                    ? false
                    : selectedVisibleIds.length === visibleIds.length
                      ? true
                      : 'mixed'
                }
                aria-label="Select all candidates"
                className={styles.checkbox}
                onClick={() =>
                  setSelectedIds(
                    selectedVisibleIds.length === visibleIds.length
                      ? new Set()
                      : new Set(visibleIds),
                  )
                }
                onKeyDown={(event) => {
                  if (event.key !== ' ' && event.key !== 'Enter') return
                  event.preventDefault()
                  setSelectedIds(
                    selectedVisibleIds.length === visibleIds.length
                      ? new Set()
                      : new Set(visibleIds),
                  )
                }}
              >
                {selectedVisibleIds.length > 0 ? <Check size={12} aria-hidden="true" /> : null}
              </span>
              {selectedVisibleIds.length > 0 ? (
                <>
                  <span className={styles.bulkBarText}>
                    <strong>{selectedVisibleIds.length}</strong> selected
                  </span>
                  <span className={styles.evaluationBarSpacer} />
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => void decide(selectedVisibleIds, 'rejected')}
                  >
                    <X size={14} aria-hidden="true" /> Reject {selectedVisibleIds.length}
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => void decide(selectedVisibleIds, 'shortlisted')}
                  >
                    <Check size={14} aria-hidden="true" /> Shortlist {selectedVisibleIds.length}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          {visibleApplications.map((row) => {
            const defaultTab: DrawerTab =
              activeStage === 'interview'
                ? 'interview'
                : activeStage === 'shortlist' || activeStage === 'rejected'
                  ? 'outreach'
                  : 'profile'
            const draft = isPostShortlistStage ? draftByApp.get(row.application_id) : undefined
            const pill = isPostShortlistStage ? getOutreachPill(draft) : null
            const canSend = Boolean(draft && !draft.is_sent && !draft.is_discarded)
            const rowBusy = rowActionId === row.application_id
            return (
              <button
                type="button"
                key={row.application_id}
                className={`${styles.row} ${isPostShortlistStage ? styles.rowOutreach : ''} ${
                  isAppliedStage ? styles.rowDecide : ''
                }`}
                onClick={() => openDrawer(row.application_id, defaultTab)}
              >
                {isAppliedStage ? (
                  <span
                    role="checkbox"
                    tabIndex={0}
                    aria-checked={selectedIds.has(row.application_id)}
                    aria-label={`Select ${row.applicant_name}`}
                    className={styles.checkbox}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleSelected(row.application_id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== ' ' && event.key !== 'Enter') return
                      event.preventDefault()
                      event.stopPropagation()
                      toggleSelected(row.application_id)
                    }}
                  >
                    {selectedIds.has(row.application_id) ? (
                      <Check size={12} aria-hidden="true" />
                    ) : null}
                  </span>
                ) : null}
                <Avatar
                  name={row.applicant_name}
                  src={row.applicant_avatar_url}
                  seed={row.candidate_id}
                  className={styles.avatar}
                  sizes="40px"
                />

                <span className={styles.identity}>
                  <span className={styles.name}>{row.applicant_name}</span>
                  <span className={styles.email}>{row.applicant_email ?? '—'}</span>
                </span>

                {pill ? (
                  <span className={`${styles.outreachPill} ${pill.className}`}>{pill.label}</span>
                ) : (
                  <span className={`${styles.score} ${scoreClass(row.score)}`}>
                    {row.score === null ? 'No score' : row.score}
                  </span>
                )}

                <span className={styles.feedback}>
                  {row.strengths?.length || row.weaknesses?.length
                    ? [
                        row.strengths?.[0] ? `+ ${row.strengths[0]}` : null,
                        row.weaknesses?.[0] ? `− ${row.weaknesses[0]}` : null,
                      ]
                        .filter(Boolean)
                        .join('  ·  ')
                    : isPostShortlistStage
                      ? 'Manual decision — no AI feedback'
                      : row.score !== null
                        ? 'ML scored — no detailed feedback'
                        : 'Awaiting evaluation'}
                </span>

                {isPostShortlistStage ? (
                  <span className={styles.outreachRowActions}>
                    {canSend && draft ? (
                      <span
                        role="button"
                        tabIndex={0}
                        className="btn btn--icon btn--sm"
                        aria-label="Send this email"
                        aria-disabled={rowBusy}
                        title="Send"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (rowBusy) return
                          void handleRowSend(draft)
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          event.stopPropagation()
                          if (rowBusy) return
                          void handleRowSend(draft)
                        }}
                      >
                        <Send size={14} aria-hidden="true" />
                      </span>
                    ) : null}
                    <span
                      role="button"
                      tabIndex={0}
                      className="btn btn--icon btn--sm"
                      aria-label={draft ? 'Regenerate draft' : 'Generate draft'}
                      aria-disabled={rowBusy}
                      title={draft ? 'Regenerate' : 'Generate draft'}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (rowBusy) return
                        void handleRowRegenerate(row.application_id)
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        event.stopPropagation()
                        if (rowBusy) return
                        void handleRowRegenerate(row.application_id)
                      }}
                    >
                      <RefreshCw size={14} aria-hidden="true" />
                    </span>
                  </span>
                ) : (
                  <span className={styles.rowActions}>
                    <span
                      className={styles.appliedDate}
                    >{`Applied ${formatDate(row.created_at)}`}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className={`btn btn--icon btn--sm ${styles.decideReject}`}
                      aria-label={`Reject ${row.applicant_name}`}
                      title="Reject"
                      onClick={(event) => {
                        event.stopPropagation()
                        void decide([row.application_id], 'rejected')
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        event.stopPropagation()
                        void decide([row.application_id], 'rejected')
                      }}
                    >
                      <X size={14} aria-hidden="true" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className={`btn btn--icon btn--sm ${styles.decideShortlist}`}
                      aria-label={`Shortlist ${row.applicant_name}`}
                      title="Shortlist"
                      onClick={(event) => {
                        event.stopPropagation()
                        void decide([row.application_id], 'shortlisted')
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        event.stopPropagation()
                        void decide([row.application_id], 'shortlisted')
                      }}
                    >
                      <Check size={14} aria-hidden="true" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className={`btn btn--icon btn--sm ${evaluatingAppId === row.application_id ? styles.evaluatingIcon : ''}`}
                      aria-label="Run AI evaluation"
                      aria-disabled={evaluatingAppId === row.application_id}
                      title={row.score !== null ? 'Re-run AI evaluation' : 'Run AI evaluation'}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (evaluatingAppId === row.application_id) return
                        void handleEvaluateSingle(row.application_id)
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        event.stopPropagation()
                        if (evaluatingAppId === row.application_id) return
                        void handleEvaluateSingle(row.application_id)
                      }}
                    >
                      <Bot size={14} aria-hidden="true" />
                    </span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <CandidateDrawer
        applicationId={drawerAppId}
        activeTab={drawerTab}
        onClose={closeDrawer}
        onTabChange={setDrawerTab}
        onApplicationChange={(appId) => updateParams({ app: appId })}
        queue={visibleIds}
        onDecide={(appId, status) => decide([appId], status)}
      />

      {isConfirmOpen ? (
        <div
          className="modal-backdrop modal-backdrop--animated"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsConfirmOpen(false)
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-recommendations-title"
          >
            <div className="modal__header">
              <div className="modal__title" id="approve-recommendations-title">
                Approve AI recommendations
              </div>
              <button
                type="button"
                className="btn btn--icon btn--sm"
                aria-label="Close"
                onClick={() => setIsConfirmOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Only candidates still in <strong>Applied</strong> will be touched. Any status you
                already changed manually stays as-is.
              </p>
              <ul className={styles.confirmList}>
                <li className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>
                    <span
                      className={`${styles.confirmRowDot} ${styles.confirmRowDotGood}`}
                      aria-hidden="true"
                    />
                    Move to Shortlisted
                  </span>
                  <span className={styles.confirmRowValue}>{screeningStats.above}</span>
                </li>
                <li className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>
                    <span
                      className={`${styles.confirmRowDot} ${styles.confirmRowDotBad}`}
                      aria-hidden="true"
                    />
                    Move to Rejected
                  </span>
                  <span className={styles.confirmRowValue}>{screeningStats.below}</span>
                </li>
                <li className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>
                    <span
                      className={`${styles.confirmRowDot} ${styles.confirmRowDotMuted}`}
                      aria-hidden="true"
                    />
                    Skip — awaiting score
                  </span>
                  <span className={styles.confirmRowValue}>{screeningStats.awaiting}</span>
                </li>
              </ul>
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={isFinalizing}
                onClick={() => setIsConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn--primary${isFinalizing ? ' btn--loading' : ''}`}
                disabled={isFinalizing || screeningStats.scored === 0}
                onClick={() => void handleApproveAll()}
              >
                {isFinalizing
                  ? 'Approving...'
                  : `Approve ${screeningStats.scored} recommendation${
                      screeningStats.scored === 1 ? '' : 's'
                    }`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {outreachConfirm !== null ? (
        <div
          className="modal-backdrop modal-backdrop--animated"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOutreachConfirm(null)
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="outreach-confirm-title"
          >
            <div className="modal__header">
              <div className="modal__title" id="outreach-confirm-title">
                {outreachConfirm === 'trustAI'
                  ? 'Generate and send without review?'
                  : outreachConfirm === 'sendAll'
                    ? `Send ${sendable} email${sendable === 1 ? '' : 's'}?`
                    : 'Discard all unsent drafts?'}
              </div>
              <button
                type="button"
                className="btn btn--icon btn--sm"
                aria-label="Close"
                onClick={() => setOutreachConfirm(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              {outreachConfirm === 'trustAI' ? (
                <p className={styles.confirmCopy}>
                  Drafts will be generated for{' '}
                  <strong>
                    {outreachStats.missing} candidate
                    {outreachStats.missing === 1 ? '' : 's'}
                  </strong>{' '}
                  and emailed immediately. AI feedback is used when present; otherwise a generic
                  template is used. This cannot be undone.
                </p>
              ) : outreachConfirm === 'sendAll' ? (
                <p className={styles.confirmCopy}>
                  Every drafted email for this job will be queued for sending. Discarded drafts are
                  skipped.
                </p>
              ) : (
                <p className={styles.confirmCopy}>
                  This removes every draft that has not been sent yet. You can generate them again
                  later.
                </p>
              )}
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={isPreparing || isSendingAll || isDeletingAll}
                onClick={() => setOutreachConfirm(null)}
              >
                Cancel
              </button>
              {outreachConfirm === 'trustAI' ? (
                <button
                  type="button"
                  className={`btn btn--primary${isPreparing ? ' btn--loading' : ''}`}
                  disabled={isPreparing}
                  onClick={() => void handleGenerateDrafts(true)}
                >
                  {isPreparing ? 'Sending...' : 'Generate & send'}
                </button>
              ) : outreachConfirm === 'sendAll' ? (
                <button
                  type="button"
                  className={`btn btn--primary${isSendingAll ? ' btn--loading' : ''}`}
                  disabled={isSendingAll}
                  onClick={() => void handleSendAll()}
                >
                  {isSendingAll ? 'Sending...' : `Send ${sendable}`}
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn btn--danger${isDeletingAll ? ' btn--loading' : ''}`}
                  disabled={isDeletingAll}
                  onClick={() => void handleDiscardAll()}
                >
                  {isDeletingAll ? 'Discarding...' : 'Discard all'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
