'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  type ApplicationStatus,
  useGetMyCompanyCandidatesQuery,
} from '@/store/services/applicationsApi'
import {
  useFinalizeShortlistMutation,
  useGetShortlistSummaryQuery,
} from '@/store/services/shortlistingApi'
import { ClipboardCheck, Mail, X } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import ButtonSpinner from '@/components/common/ButtonSpinner'
import CandidateDrawer, {
  DRAWER_TABS,
  type DrawerTab,
} from '@/components/recruiter/CandidateDrawer/CandidateDrawer'

import styles from './JobPipelineWorkspace.module.scss'

const STAGES: Array<{ id: PipelineStage; label: string; statuses: ApplicationStatus[] }> = [
  { id: 'applied', label: 'Applied', statuses: ['applied'] },
  { id: 'screening', label: 'Screening', statuses: ['screening'] },
  { id: 'shortlist', label: 'Shortlist', statuses: ['shortlisted'] },
  {
    id: 'interview',
    label: 'Interview',
    statuses: ['interview_booked', 'interview_completed'],
  },
  { id: 'offer', label: 'Offer', statuses: ['offer', 'offer_accepted', 'offer_declined'] },
  { id: 'rejected', label: 'Rejected', statuses: ['rejected'] },
]

type PipelineStage = 'applied' | 'screening' | 'shortlist' | 'interview' | 'offer' | 'rejected'

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
  const drawerTab: DrawerTab = (DRAWER_TABS as readonly string[]).includes(drawerTabParam ?? '')
    ? (drawerTabParam as DrawerTab)
    : 'profile'

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
      feedback: string | null
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
            status: application.status,
            score: application.score,
            feedback: application.feedback,
            created_at: application.created_at,
          })
        })
    })
    return rows
  }, [candidates, jobId])

  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {
      applied: 0,
      screening: 0,
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
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [jobApplications, visibleStage],
  )

  // ── AI screening summary + bulk-approve wiring ──────────────────────────
  const isPreShortlistStage = activeStage === 'applied' || activeStage === 'screening'
  const { data: summaryResp } = useGetShortlistSummaryQuery(jobId, { skip: !isPreShortlistStage })
  const summary = summaryResp?.data
  const threshold = summary?.shortlist_threshold ?? null

  const screeningStats = useMemo(() => {
    const pending = jobApplications.filter(
      (row) => row.status === 'applied' || row.status === 'screening',
    )
    const scored = pending.filter((row) => row.score !== null && row.feedback !== null)
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

  useEffect(() => {
    if (!isConfirmOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsConfirmOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [isConfirmOpen])

  const canApprove =
    isPreShortlistStage &&
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
      toast.success(
        `Approved ${response.data.updated_applications} AI recommendation${
          response.data.updated_applications === 1 ? '' : 's'
        }.`,
      )
      await refetch()
    } catch {
      toast.error('Could not approve AI recommendations.')
    }
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

      {isPreShortlistStage && threshold !== null && screeningStats.pending > 0 ? (
        <div
          className={styles.screeningBar}
          title={
            showOutreachCta
              ? 'Statuses updated. Generate outreach emails next.'
              : `Score ≥ ${threshold} → Shortlisted · Score < ${threshold} → Rejected · Manual moves left alone`
          }
        >
          <span className={styles.screeningBarEyebrow}>AI screening</span>
          {showOutreachCta ? (
            <span className={styles.screeningBarText}>Recommendations applied</span>
          ) : (
            <>
              <span className={styles.screeningBarText}>
                <strong>{screeningStats.scored}</strong> of {screeningStats.pending} ready
              </span>
              <span className={styles.screeningBarSep} aria-hidden="true">
                ·
              </span>
              <span
                className={`${styles.screeningBarChip} ${styles.screeningBarChipGood}`}
                title={`Ready to shortlist (≥ ${threshold})`}
              >
                ✓ {screeningStats.above}
              </span>
              <span
                className={`${styles.screeningBarChip} ${styles.screeningBarChipBad}`}
                title={`Ready to reject (< ${threshold})`}
              >
                ✗ {screeningStats.below}
              </span>
              {screeningStats.awaiting > 0 ? (
                <span
                  className={`${styles.screeningBarChip} ${styles.screeningBarChipMuted}`}
                  title="Still being scored"
                >
                  … {screeningStats.awaiting}
                </span>
              ) : null}
            </>
          )}
          <span className={styles.screeningBarSpacer} />
          {showOutreachCta ? (
            <Link href={`/recruiter/outreach?job=${jobId}`} className="btn btn--primary btn--sm">
              Draft outreach
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={!canApprove || isFinalizing}
              onClick={() => setIsConfirmOpen(true)}
            >
              {isFinalizing ? (
                <ButtonSpinner label="Approving..." />
              ) : screeningStats.scored > 0 ? (
                `Approve ${screeningStats.scored}`
              ) : (
                'Waiting for scores'
              )}
            </button>
          )}
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
          {visibleApplications.map((row) => {
            const defaultTab: DrawerTab =
              activeStage === 'screening'
                ? 'evaluation'
                : activeStage === 'interview'
                  ? 'interview'
                  : activeStage === 'shortlist' || activeStage === 'rejected'
                    ? 'outreach'
                    : 'profile'
            return (
              <button
                type="button"
                key={row.application_id}
                className={styles.row}
                onClick={() => openDrawer(row.application_id, defaultTab)}
              >
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

                <span className={`${styles.score} ${scoreClass(row.score)}`}>
                  {row.score === null ? 'No score' : row.score}
                </span>

                <span className={styles.feedback}>{row.feedback ?? 'No review yet.'}</span>

                <span className={styles.applied}>
                  {activeStage === 'screening' ? (
                    <>
                      <ClipboardCheck size={12} aria-hidden="true" /> Score
                    </>
                  ) : activeStage === 'shortlist' || activeStage === 'rejected' ? (
                    <>
                      <Mail size={12} aria-hidden="true" /> Email
                    </>
                  ) : (
                    `Applied ${formatDate(row.created_at)}`
                  )}
                </span>
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
                Only candidates still in <strong>Applied</strong> or <strong>Screening</strong> will
                be touched. Any status you already changed manually stays as-is.
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
                className="btn btn--primary"
                disabled={isFinalizing || screeningStats.scored === 0}
                onClick={() => void handleApproveAll()}
              >
                {isFinalizing ? (
                  <ButtonSpinner label="Approving..." />
                ) : (
                  `Approve ${screeningStats.scored} recommendation${
                    screeningStats.scored === 1 ? '' : 's'
                  }`
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
