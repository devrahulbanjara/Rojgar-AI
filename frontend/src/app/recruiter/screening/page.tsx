'use client'

import { Fragment, useDeferredValue, useMemo, useState } from 'react'
import type { SetStateAction } from 'react'
import { toast } from 'react-toastify'

import { getInitials } from '@/lib/mediaValidation'
import {
  type RecruiterApplicationView,
  useGetJobApplicationsQuery,
  useUpdateApplicationReviewMutation,
  useUpdateApplicationStatusMutation,
} from '@/store/services/applicationsApi'
import {
  type JobListItem,
  getJobStatusLabel,
  useGetCompanyJobsQuery,
  useUpdateJobMutation,
} from '@/store/services/jobsApi'
import {
  useFinalizeShortlistMutation,
  useGetShortlistSummaryQuery,
  useTriggerShortlistingMutation,
} from '@/store/services/shortlistingApi'
import { X as ClearSearchIcon, Search as SearchFieldIcon } from 'lucide-react'

import {
  ScreeningStatusCardSkeleton,
  ScreeningTableSkeleton,
} from './_components/ScreeningSkeletons'
import styles from './screening.module.css'

type ReviewDraft = {
  score: string
  feedback: string
}

type ScoreFilter = 'all' | 'high' | 'mid' | 'low'
type ReviewFilter = 'all' | 'reviewed' | 'pending' | 'missing'

const PAGE_SIZE = 8

function getJobOptionLabel(job: JobListItem) {
  return `${job.title} (${getJobStatusLabel(job.status)})`
}

function hasExpired(job: Pick<JobListItem, 'status' | 'expires_at'> | null) {
  if (!job) return false
  if (job.status === 'expired') return true
  if (!job.expires_at) return false
  return new Date(job.expires_at).getTime() <= Date.now()
}

function toDraft(application: RecruiterApplicationView): ReviewDraft {
  return {
    score: application.score != null ? String(application.score) : '',
    feedback: application.feedback ?? '',
  }
}

function hasCompleteReview(application: Pick<RecruiterApplicationView, 'score' | 'feedback'>) {
  return application.score != null && Boolean(application.feedback?.trim())
}

function getAvatarTone(name: string) {
  const tones = [
    styles.avatarBlue,
    styles.avatarAmber,
    styles.avatarRose,
    styles.avatarTeal,
    styles.avatarSlate,
  ]
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return tones[seed % tones.length]
}

function getScoreTone(score: number | null) {
  if (score == null) return styles.scoreMuted
  if (score >= 75) return styles.scoreGreen
  if (score >= 50) return styles.scoreAmber
  return styles.scoreRed
}

function getScoreBarTone(score: number | null) {
  if (score == null) return styles.scoreBarMuted
  if (score >= 75) return styles.scoreBarGreen
  if (score >= 50) return styles.scoreBarAmber
  return styles.scoreBarRed
}

function getReviewState(
  application: RecruiterApplicationView,
  options: { autoShortlist: boolean; isAiProcessing: boolean },
) {
  if (application.status === 'screening' || application.status === 'interview') {
    return { label: 'Shortlisted', tone: styles.stateReviewed }
  }
  if (application.status === 'rejected') {
    return { label: 'Rejected', tone: styles.stateMissing }
  }
  if (hasCompleteReview(application)) {
    return { label: 'Reviewed', tone: styles.stateReviewed }
  }
  if (!options.autoShortlist) {
    return { label: 'Pending', tone: styles.statePending }
  }
  if (options.isAiProcessing) {
    return { label: 'Pending', tone: styles.statePending }
  }
  return { label: 'Missing review', tone: styles.stateMissing }
}

function getReviewPreview(
  application: RecruiterApplicationView,
  options: { autoShortlist: boolean; isAiProcessing: boolean },
) {
  if (application.feedback?.trim()) return application.feedback.trim()
  if (!options.autoShortlist) {
    return 'No manual review yet. Recruiters can optionally add a score and feedback.'
  }
  if (options.isAiProcessing) {
    return 'AI review in progress. This row will update when the background screening finishes.'
  }
  return 'No AI review yet. Click Rerun AI review to generate a score and feedback.'
}

function buildPagination(currentPage: number, totalPages: number) {
  if (totalPages <= 1) return [1]

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  const validPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
  const output: Array<number | 'ellipsis'> = []

  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index]
    const previous = validPages[index - 1]

    if (previous != null && page - previous > 1) {
      output.push('ellipsis')
    }

    output.push(page)
  }

  return output
}

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M10.75 2.75l2.5 2.5M3 13h2.1l7.4-7.4-2.5-2.5L2.6 10.5V13H3z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M5 7V5.7a3 3 0 116 0V7M4.5 7h7a1 1 0 011 1v4a1 1 0 01-1 1h-7a1 1 0 01-1-1V8a1 1 0 011-1z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 7.25V10.25M8 5.5h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M13 8a5 5 0 11-1.25-3.3M13 3.75V7h-3.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 8.5l2.7 2.7 6-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4.25 4.25l7.5 7.5m0-7.5l-7.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default function RecruiterScreeningPage() {
  const { data: jobsResp, isLoading: isLoadingJobs } = useGetCompanyJobsQuery()
  const [jobListMode, setJobListMode] = useState<'pending' | 'all'>('pending')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [thresholdByJobId, setThresholdByJobId] = useState<Record<string, string>>({})
  const [isPollingSummary, setIsPollingSummary] = useState(false)
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({})
  const [expandedByJobId, setExpandedByJobId] = useState<Record<string, string | null>>({})
  const [searchTermByJobId, setSearchTermByJobId] = useState<Record<string, string>>({})
  const [scoreFilterByJobId, setScoreFilterByJobId] = useState<Record<string, ScoreFilter>>({})
  const [reviewFilterByJobId, setReviewFilterByJobId] = useState<Record<string, ReviewFilter>>({})
  const [pageByJobId, setPageByJobId] = useState<Record<string, number>>({})

  const eligibleJobs = useMemo(
    () =>
      [...(jobsResp?.data ?? [])]
        .filter((job) => job.status === 'active' || job.status === 'expired')
        .sort((a, b) => {
          if (a.final_shortlist_completed !== b.final_shortlist_completed) {
            return a.final_shortlist_completed ? 1 : -1
          }
          if (a.status === b.status) return 0
          return a.status === 'active' ? -1 : 1
        }),
    [jobsResp?.data],
  )

  const jobs = useMemo(
    () =>
      jobListMode === 'pending'
        ? eligibleJobs.filter((job) => !job.final_shortlist_completed)
        : eligibleJobs,
    [eligibleJobs, jobListMode],
  )

  const activeJobId = jobs.some((job) => job.id === selectedJobId)
    ? selectedJobId
    : (jobs[0]?.id ?? '')
  const activeJob = jobs.find((job) => job.id === activeJobId) ?? null
  const activeJobExpired = hasExpired(activeJob)
  const threshold = activeJobId
    ? (thresholdByJobId[activeJobId] ?? String(activeJob?.shortlist_threshold ?? 70))
    : '70'
  const expandedApplicationId = activeJobId ? (expandedByJobId[activeJobId] ?? null) : null
  const searchTerm = activeJobId ? (searchTermByJobId[activeJobId] ?? '') : ''
  const scoreFilter = activeJobId ? (scoreFilterByJobId[activeJobId] ?? 'all') : 'all'
  const reviewFilter = activeJobId ? (reviewFilterByJobId[activeJobId] ?? 'all') : 'all'
  const page = activeJobId ? (pageByJobId[activeJobId] ?? 1) : 1
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const {
    data: summaryResp,
    refetch: refetchSummary,
    isLoading: isLoadingSummary,
  } = useGetShortlistSummaryQuery(activeJobId, {
    skip: !activeJobId,
    pollingInterval: isPollingSummary ? 10000 : 0,
  })

  const {
    data: appsResp,
    refetch: refetchApps,
    isLoading: isLoadingApps,
    isFetching: isFetchingApps,
  } = useGetJobApplicationsQuery(
    { job_id: activeJobId, page: 1, size: 100 },
    { skip: !activeJobId },
  )

  const [triggerShortlisting, { isLoading: isTriggering }] = useTriggerShortlistingMutation()
  const [finalizeShortlist, { isLoading: isFinalizing }] = useFinalizeShortlistMutation()
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateApplicationStatusMutation()
  const [updateReview, { isLoading: isUpdatingReview }] = useUpdateApplicationReviewMutation()
  const [updateJob, { isLoading: isUpdatingJob }] = useUpdateJobMutation()

  const summary = summaryResp?.data
  const shouldPollSummary = isPollingSummary || summary?.shortlist_status === 'in_progress'
  const applications = useMemo(
    () =>
      [...(appsResp?.data ?? [])].sort((left, right) => {
        const leftReviewed = hasCompleteReview(left)
        const rightReviewed = hasCompleteReview(right)

        if (leftReviewed !== rightReviewed) return leftReviewed ? -1 : 1
        return (right.score ?? -1) - (left.score ?? -1)
      }),
    [appsResp?.data],
  )

  const reviewedCount = useMemo(
    () => applications.filter((application) => hasCompleteReview(application)).length,
    [applications],
  )
  const incompleteCount = Math.max(applications.length - reviewedCount, 0)
  const pendingCount = activeJob?.auto_shortlist
    ? shouldPollSummary
      ? incompleteCount
      : 0
    : incompleteCount
  const missingCount = activeJob?.auto_shortlist ? (shouldPollSummary ? 0 : incompleteCount) : 0
  const totalCandidates = Math.max(activeJob?.applications_count ?? 0, applications.length)
  const numericThreshold = Number(threshold)
  const aboveThresholdCount = applications.filter(
    (application) =>
      application.status === 'submitted' &&
      hasCompleteReview(application) &&
      application.score != null &&
      application.score >= numericThreshold,
  ).length

  function setThreshold(next: string) {
    if (!activeJobId) return
    setThresholdByJobId((prev) => ({ ...prev, [activeJobId]: next }))
  }

  function setExpandedApplicationId(next: SetStateAction<string | null>) {
    if (!activeJobId) return
    setExpandedByJobId((prev) => ({
      ...prev,
      [activeJobId]:
        typeof next === 'function' ? (next(prev[activeJobId] ?? null) as string | null) : next,
    }))
  }

  function setSearchTerm(next: string) {
    if (!activeJobId) return
    setSearchTermByJobId((prev) => ({ ...prev, [activeJobId]: next }))
    setPageByJobId((prev) => ({ ...prev, [activeJobId]: 1 }))
  }

  function setScoreFilter(next: ScoreFilter) {
    if (!activeJobId) return
    setScoreFilterByJobId((prev) => ({ ...prev, [activeJobId]: next }))
    setPageByJobId((prev) => ({ ...prev, [activeJobId]: 1 }))
  }

  function setReviewFilter(next: SetStateAction<ReviewFilter>) {
    if (!activeJobId) return
    const resolved = typeof next === 'function' ? next(reviewFilter) : next
    setReviewFilterByJobId((prev) => ({ ...prev, [activeJobId]: resolved }))
    setPageByJobId((prev) => ({ ...prev, [activeJobId]: 1 }))
  }

  function setPage(next: SetStateAction<number>) {
    if (!activeJobId) return
    setPageByJobId((prev) => ({
      ...prev,
      [activeJobId]: typeof next === 'function' ? next(prev[activeJobId] ?? 1) : next,
    }))
  }

  function setReviewDraft(applicationId: string, next: Partial<ReviewDraft>) {
    const application = applications.find((entry) => entry.id === applicationId)
    setReviewDrafts((prev) => ({
      ...prev,
      [applicationId]: {
        ...(prev[applicationId] ??
          (application ? toDraft(application) : { score: '', feedback: '' })),
        ...next,
      },
    }))
  }

  function getReviewDraft(application: RecruiterApplicationView) {
    return reviewDrafts[application.id] ?? toDraft(application)
  }

  function hasReviewChanged(application: RecruiterApplicationView) {
    const draft = getReviewDraft(application)
    const currentScore = application.score != null ? String(application.score) : ''
    const currentFeedback = application.feedback ?? ''

    return draft.score.trim() !== currentScore || draft.feedback.trim() !== currentFeedback
  }

  function toggleExpanded(applicationId: string) {
    setExpandedApplicationId((current) => (current === applicationId ? null : applicationId))
  }

  function handleClearSearch() {
    setSearchTerm('')
  }

  async function refreshAll() {
    await Promise.allSettled([refetchSummary(), refetchApps()])
  }

  async function handleTrigger() {
    if (!activeJobId) return
    try {
      setIsPollingSummary(true)
      const response = await triggerShortlisting(activeJobId).unwrap()
      if (response.data.shortlist_status === 'in_progress') {
        toast.success(response.message)
      } else {
        setIsPollingSummary(false)
        toast.info(response.message)
      }
      void refetchSummary()
      void refetchApps()
    } catch {
      setIsPollingSummary(false)
      toast.error('Unable to run AI screening right now.')
    }
  }

  async function handleSaveThreshold() {
    if (!activeJobId) return
    if (!Number.isFinite(numericThreshold) || numericThreshold < 0 || numericThreshold > 100) {
      toast.error('Threshold must be between 0 and 100.')
      return
    }

    try {
      await updateJob({ id: activeJobId, shortlist_threshold: numericThreshold }).unwrap()
      toast.success('Threshold updated.')
      void refetchSummary()
    } catch {
      toast.error('Could not update the shortlist threshold.')
    }
  }

  async function handleReviewSave(application: RecruiterApplicationView) {
    const draft = getReviewDraft(application)
    const score = draft.score.trim()
    const feedback = draft.feedback.trim()

    if (!score && !feedback) {
      toast.error('Add a score, feedback, or both before saving.')
      return
    }

    const body: { score?: number | null; feedback?: string | null } = {}

    if (score) {
      const parsedScore = Number(score)
      if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100) {
        toast.error('Score must be between 0 and 100.')
        return
      }
      body.score = parsedScore
    }

    if (feedback || application.feedback) {
      body.feedback = feedback || null
    }

    try {
      await updateReview({ application_id: application.id, body }).unwrap()
      setReviewDrafts((prev) => {
        const nextDrafts = { ...prev }
        delete nextDrafts[application.id]
        return nextDrafts
      })
      toast.success('Review saved.')
      void refreshAll()
    } catch {
      toast.error('Could not save the application review.')
    }
  }

  async function handleStatus(applicationId: string, status: 'screening' | 'rejected') {
    try {
      await updateStatus({ application_id: applicationId, body: { status } }).unwrap()
      toast.success(status === 'screening' ? 'Candidate shortlisted.' : 'Candidate rejected.')
      void refreshAll()
    } catch {
      toast.error('Could not update application status.')
    }
  }

  async function handleCompleteShortlist() {
    if (!activeJobId) return
    try {
      await finalizeShortlist({
        jobId: activeJobId,
        use_ai_recommendations: false,
      }).unwrap()
      toast.success('Shortlist marked complete.')
      setIsPollingSummary(false)
      void refreshAll()
    } catch {
      toast.error('Could not complete the shortlist.')
    }
  }

  async function handleApproveAiRecommendations() {
    if (!activeJobId) return
    if (!Number.isFinite(numericThreshold) || numericThreshold < 0 || numericThreshold > 100) {
      toast.error('Threshold must be between 0 and 100.')
      return
    }

    try {
      await finalizeShortlist({
        jobId: activeJobId,
        use_ai_recommendations: true,
        threshold: numericThreshold,
      }).unwrap()
      toast.success('AI recommendations approved.')
      setIsPollingSummary(false)
      void refreshAll()
    } catch {
      toast.error('Could not approve AI recommendations.')
    }
  }

  const canRunScreening =
    Boolean(summary) &&
    applications.length > 0 &&
    incompleteCount > 0 &&
    summary?.shortlist_status !== 'in_progress'

  const canApproveAiRecommendations =
    Boolean(activeJob?.auto_shortlist) &&
    activeJobExpired &&
    !summary?.final_shortlist_completed &&
    applications.some(
      (application) =>
        application.status === 'submitted' &&
        application.score != null &&
        Boolean(application.feedback?.trim()),
    )

  const filteredApplications = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()

    return applications.filter((application) => {
      const reviewState = getReviewState(application, {
        autoShortlist: Boolean(activeJob?.auto_shortlist),
        isAiProcessing: shouldPollSummary && !hasCompleteReview(application),
      })
      const score = application.score
      const matchesSearch =
        normalizedSearch.length === 0 ||
        application.applicant_name.toLowerCase().includes(normalizedSearch) ||
        application.applicant_email.toLowerCase().includes(normalizedSearch)

      const matchesScore =
        scoreFilter === 'all' ||
        (scoreFilter === 'high' && score != null && score >= numericThreshold) ||
        (scoreFilter === 'mid' &&
          score != null &&
          score >= 50 &&
          score < Math.max(numericThreshold, 50)) ||
        (scoreFilter === 'low' && score != null && score < 50)

      const matchesReview =
        reviewFilter === 'all' ||
        (reviewFilter === 'reviewed' && reviewState.label === 'Reviewed') ||
        (reviewFilter === 'pending' && reviewState.label === 'Pending') ||
        (reviewFilter === 'missing' && reviewState.label === 'Missing review')

      return matchesSearch && matchesScore && matchesReview
    })
  }, [
    activeJob?.auto_shortlist,
    applications,
    deferredSearchTerm,
    numericThreshold,
    reviewFilter,
    scoreFilter,
    shouldPollSummary,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pagedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredApplications.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, filteredApplications])

  const paginationModel = useMemo(
    () => buildPagination(currentPage, totalPages),
    [currentPage, totalPages],
  )
  const isLoadingContent = isLoadingJobs || (!!activeJobId && (isLoadingSummary || isLoadingApps))
  const isBusy =
    isTriggering || isFinalizing || isUpdatingStatus || isUpdatingReview || isUpdatingJob

  return (
    <div className={`dash-content container container--app-shell ${styles.screeningPage}`}>
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Screening</h2>
          <p className="dash-page-header__subtitle">
            Review applicants, edit AI scores, and complete shortlist decisions.
          </p>
        </div>
      </div>

      {!isLoadingJobs && !activeJobId ? (
        <div className={styles.emptyState}>
          {jobListMode === 'pending' && eligibleJobs.length > 0
            ? 'No jobs are awaiting shortlist completion right now. Switch to All eligible jobs to review completed ones.'
            : 'No active or expired jobs are available for screening yet.'}
        </div>
      ) : null}

      <div className={styles.contextBar}>
        <div className={styles.contextTop}>
          {isLoadingJobs ? (
            <div className={styles.selectorRow}>
              <div className="skeleton-block screening-skeleton__select" aria-hidden="true" />
              <div className="skeleton-block screening-skeleton__select" aria-hidden="true" />
            </div>
          ) : (
            <div className={styles.selectorRow}>
              <label className={styles.selectWrap}>
                <span className={styles.selectLabel}>View</span>
                <select
                  className={styles.select}
                  value={jobListMode}
                  onChange={(event) => {
                    setJobListMode(event.target.value as 'pending' | 'all')
                    setIsPollingSummary(false)
                  }}
                >
                  <option value="pending">Pending shortlists</option>
                  <option value="all">All eligible jobs</option>
                </select>
              </label>

              <label className={styles.selectWrap}>
                <span className={styles.selectLabel}>Job</span>
                <select
                  className={styles.select}
                  value={activeJobId}
                  onChange={(event) => {
                    setSelectedJobId(event.target.value)
                    setIsPollingSummary(false)
                  }}
                >
                  <option value="">Select a job</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {getJobOptionLabel(job)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        {isLoadingContent ? (
          <ScreeningStatusCardSkeleton />
        ) : activeJob && summary ? (
          <>
            <div className={styles.contextMeta}>
              <div className={styles.badgeGroup}>
                <span
                  className={`${styles.statusBadge} ${activeJob.auto_shortlist ? styles.badgeBlue : styles.badgeSlate}`}
                >
                  <span className={styles.statusDot} />
                  {activeJob.auto_shortlist ? 'Auto-shortlist on' : 'Manual review'}
                </span>
                <span
                  className={`${styles.statusBadge} ${
                    summary.shortlist_status === 'completed'
                      ? styles.badgeGreen
                      : summary.shortlist_status === 'failed'
                        ? styles.badgeRed
                        : summary.shortlist_status === 'in_progress'
                          ? styles.badgeAmber
                          : styles.badgeSlate
                  }`}
                >
                  <span className={styles.statusDot} />
                  {summary.shortlist_status === 'completed'
                    ? 'Screening complete'
                    : summary.shortlist_status === 'in_progress'
                      ? 'AI review running'
                      : summary.shortlist_status === 'failed'
                        ? 'Screening failed'
                        : 'Not started'}
                </span>
                <span
                  className={`${styles.statusBadge} ${activeJobExpired ? styles.badgeTeal : styles.badgeAmber}`}
                >
                  <span className={styles.statusDot} />
                  {activeJobExpired ? 'Job expired' : 'Job active'}
                </span>
                {summary.final_shortlist_completed ? (
                  <span className={`${styles.statusBadge} ${styles.badgeGreen}`}>
                    <span className={styles.statusDot} />
                    Shortlist finalized
                  </span>
                ) : null}
              </div>

              <div className={styles.statsGroup}>
                <span className={styles.statPill}>
                  <strong>{totalCandidates}</strong> candidates
                </span>
                <span className={styles.statPill}>
                  <strong>{reviewedCount}</strong> reviewed
                </span>
                <span className={styles.statPill}>
                  <strong>{pendingCount}</strong> pending
                </span>
                <span className={`${styles.statPill} ${styles.statPillAlert}`}>
                  <strong>{missingCount}</strong> missing AI review
                </span>
              </div>
            </div>

            <div className={styles.actionStrip}>
              <div className={styles.thresholdCluster}>
                <span className={styles.thresholdLabel}>Shortlist threshold</span>
                <input
                  id="screening-threshold"
                  type="number"
                  min={0}
                  max={100}
                  className={styles.thresholdInput}
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  disabled={activeJobExpired || isUpdatingJob}
                />
                <span className={styles.thresholdSuffix}>/100</span>
                <button
                  className="btn btn--outline btn--sm"
                  disabled={activeJobExpired || isUpdatingJob}
                  onClick={() => void handleSaveThreshold()}
                >
                  {isUpdatingJob ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className={styles.infoButton}
                  title="Threshold stays editable while the job is active. Once the job expires, shortlist and reject actions unlock instead."
                >
                  <InfoIcon />
                </button>
              </div>

              <div className={styles.actionCluster}>
                {canRunScreening ? (
                  <button
                    className="btn btn--primary btn--sm"
                    disabled={isBusy}
                    onClick={() => void handleTrigger()}
                  >
                    <RefreshIcon />
                    {isTriggering
                      ? 'Running...'
                      : activeJob.auto_shortlist
                        ? `Rerun AI review (${missingCount} missing)`
                        : 'Run AI screening'}
                  </button>
                ) : null}

                {canApproveAiRecommendations ? (
                  <button
                    className="btn btn--primary btn--sm"
                    disabled={isBusy}
                    onClick={() => void handleApproveAiRecommendations()}
                  >
                    {isFinalizing
                      ? 'Approving...'
                      : `Approve AI recommendations (${aboveThresholdCount} above threshold)`}
                  </button>
                ) : null}

                {summary.final_shortlist_completed ? (
                  <div className={styles.finalizedBanner}>
                    <LockIcon />
                    Shortlist finalized
                  </div>
                ) : (
                  <button
                    className={`btn btn--sm ${canApproveAiRecommendations ? 'btn--outline' : 'btn--primary'}`}
                    disabled={isBusy}
                    onClick={() => void handleCompleteShortlist()}
                  >
                    {isFinalizing ? 'Completing...' : 'Complete shortlist'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {isLoadingContent || (activeJobId && isFetchingApps) ? (
        <ScreeningTableSkeleton rows={6} />
      ) : activeJobId ? (
        applications.length === 0 ? (
          <div className={styles.emptyState}>No applications available for this job yet.</div>
        ) : (
          <section className={styles.tableSection}>
            <div className={styles.filterBar}>
              <label
                className="dash-page-toolbar__search"
                style={{ flex: '1 1 22rem', maxWidth: '26rem' }}
              >
                <span className="dash-page-toolbar__icon">
                  <SearchFieldIcon size={16} aria-hidden="true" />
                </span>
                <input
                  className="dash-page-toolbar__input"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search candidates by name or email"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    className="dash-page-toolbar__clear"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                  >
                    <ClearSearchIcon size={14} aria-hidden="true" />
                  </button>
                ) : null}
              </label>

              <div className={styles.filterCluster}>
                <span className={styles.filterLabel}>Score:</span>
                <button
                  className={`${styles.filterChip} ${scoreFilter === 'all' ? styles.filterChipActive : ''}`}
                  onClick={() => setScoreFilter('all')}
                >
                  All
                </button>
                <button
                  className={`${styles.filterChip} ${scoreFilter === 'high' ? styles.filterChipActive : ''}`}
                  onClick={() => setScoreFilter('high')}
                >
                  {'\u2265'} {numericThreshold}
                </button>
                <button
                  className={`${styles.filterChip} ${scoreFilter === 'mid' ? styles.filterChipActive : ''}`}
                  onClick={() => setScoreFilter('mid')}
                >
                  50-{Math.max(numericThreshold - 1, 50)}
                </button>
                <button
                  className={`${styles.filterChip} ${scoreFilter === 'low' ? styles.filterChipActive : ''}`}
                  onClick={() => setScoreFilter('low')}
                >
                  {'<'} 50
                </button>
                <span className={styles.verticalDivider} />
                <button
                  className={`${styles.filterChip} ${reviewFilter === 'reviewed' ? styles.filterChipActive : ''}`}
                  onClick={() =>
                    setReviewFilter((current) => (current === 'reviewed' ? 'all' : 'reviewed'))
                  }
                >
                  Reviewed
                </button>
                <button
                  className={`${styles.filterChip} ${reviewFilter === 'pending' ? styles.filterChipActive : ''}`}
                  onClick={() =>
                    setReviewFilter((current) => (current === 'pending' ? 'all' : 'pending'))
                  }
                >
                  Pending
                </button>
                <button
                  className={`${styles.filterChip} ${reviewFilter === 'missing' ? styles.filterChipActive : ''}`}
                  onClick={() =>
                    setReviewFilter((current) => (current === 'missing' ? 'all' : 'missing'))
                  }
                >
                  Missing review
                </button>
              </div>
            </div>

            <div className={styles.tableSummary}>
              {filteredApplications.length === applications.length
                ? `${filteredApplications.length} candidates loaded`
                : `${filteredApplications.length} of ${applications.length} candidates shown`}
            </div>

            <div className={styles.tableShell}>
              <div className={styles.tableScroller}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Review</th>
                      <th>Score</th>
                      <th>Status / Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedApplications.map((application) => {
                      const reviewState = getReviewState(application, {
                        autoShortlist: Boolean(activeJob?.auto_shortlist),
                        isAiProcessing: shouldPollSummary && !hasCompleteReview(application),
                      })
                      const reviewText = getReviewPreview(application, {
                        autoShortlist: Boolean(activeJob?.auto_shortlist),
                        isAiProcessing: shouldPollSummary && !hasCompleteReview(application),
                      })
                      const isExpanded = expandedApplicationId === application.id
                      const draft = getReviewDraft(application)
                      const scoreTone = getScoreTone(application.score)
                      const scoreBarTone = getScoreBarTone(application.score)

                      return (
                        <Fragment key={application.id}>
                          <tr
                            className={`${styles.dataRow} ${isExpanded ? styles.dataRowExpanded : ''}`}
                            onClick={() => toggleExpanded(application.id)}
                          >
                            <td>
                              <div className={styles.candidateCell}>
                                <div
                                  className={`${styles.avatar} ${getAvatarTone(application.applicant_name)}`}
                                  style={
                                    application.applicant_avatar_url
                                      ? {
                                          backgroundImage: `url(${application.applicant_avatar_url})`,
                                        }
                                      : undefined
                                  }
                                >
                                  {!application.applicant_avatar_url &&
                                    getInitials(application.applicant_name)}
                                </div>
                                <div className={styles.candidateMeta}>
                                  <div className={styles.candidateName}>
                                    {application.applicant_name}
                                  </div>
                                  <div className={styles.candidateEmail}>
                                    {application.applicant_email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className={styles.reviewCell}>
                                <p
                                  className={`${styles.reviewText} ${
                                    !hasCompleteReview(application) ? styles.reviewTextMuted : ''
                                  }`}
                                >
                                  {reviewText}
                                </p>
                                <div className={styles.reviewActions}>
                                  {application.feedback && application.feedback.length > 140 ? (
                                    <button
                                      className={styles.inlineLink}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        toggleExpanded(application.id)
                                      }}
                                    >
                                      {isExpanded ? 'Hide details' : 'Read more'}
                                    </button>
                                  ) : null}
                                  <button
                                    className={styles.inlineLink}
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      toggleExpanded(application.id)
                                    }}
                                  >
                                    <EditIcon />
                                    Edit review
                                  </button>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className={styles.scoreCell}>
                                {application.score == null ? (
                                  <span className={styles.scoreDash}>-</span>
                                ) : (
                                  <>
                                    <div className={`${styles.scoreBadge} ${scoreTone}`}>
                                      {application.score}
                                      <span className={styles.scoreSuffix}>/100</span>
                                    </div>
                                    <div className={styles.scoreBarTrack}>
                                      <span
                                        className={`${styles.scoreBarFill} ${scoreBarTone}`}
                                        style={{
                                          width: `${Math.min(Math.max(application.score, 0), 100)}%`,
                                        }}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>

                            <td>
                              <div className={styles.statusActionCell}>
                                <span className={`${styles.statePill} ${reviewState.tone}`}>
                                  {reviewState.label}
                                </span>

                                {activeJobExpired && !summary?.final_shortlist_completed ? (
                                  <div
                                    className={styles.rowActionButtons}
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <button
                                      className={`${styles.iconAction} ${styles.iconActionApprove}`}
                                      title="Shortlist candidate"
                                      disabled={isUpdatingStatus}
                                      onClick={() => void handleStatus(application.id, 'screening')}
                                    >
                                      <CheckIcon />
                                    </button>
                                    <button
                                      className={`${styles.iconAction} ${styles.iconActionReject}`}
                                      title="Reject candidate"
                                      disabled={isUpdatingStatus}
                                      onClick={() => void handleStatus(application.id, 'rejected')}
                                    >
                                      <XIcon />
                                    </button>
                                  </div>
                                ) : summary?.final_shortlist_completed ? (
                                  <span className={styles.lockHint}>
                                    <LockIcon />
                                    Finalized
                                  </span>
                                ) : (
                                  <span
                                    className={styles.lockHint}
                                    title="Shortlist and reject actions unlock after the job expires."
                                  >
                                    <LockIcon />
                                    After expiry
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded ? (
                            <tr className={styles.expandedRow}>
                              <td colSpan={4}>
                                <div className={styles.expandedPanel}>
                                  <div className={styles.expandedGrid}>
                                    <div>
                                      <div className={styles.expandedLabel}>Edit review</div>
                                      <div className={styles.scoreEditorRow}>
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          className={styles.scoreEditorInput}
                                          placeholder="Score"
                                          value={draft.score}
                                          onChange={(event) =>
                                            setReviewDraft(application.id, {
                                              score: event.target.value,
                                            })
                                          }
                                        />
                                        <span className={styles.thresholdSuffix}>/100</span>
                                      </div>
                                      <textarea
                                        className={styles.feedbackTextarea}
                                        rows={5}
                                        placeholder="Add score context, strengths, concerns, or recruiter notes..."
                                        value={draft.feedback}
                                        onChange={(event) =>
                                          setReviewDraft(application.id, {
                                            feedback: event.target.value,
                                          })
                                        }
                                      />
                                    </div>

                                    <div className={styles.referencePanel}>
                                      <div className={styles.expandedLabel}>
                                        {activeJob?.auto_shortlist
                                          ? 'Current AI review'
                                          : 'Current saved review'}
                                      </div>
                                      <div className={styles.referenceScore}>
                                        Score:{' '}
                                        <strong>
                                          {application.score != null
                                            ? `${application.score}/100`
                                            : 'Not scored yet'}
                                        </strong>
                                      </div>
                                      <p className={styles.referenceText}>{reviewText}</p>
                                    </div>
                                  </div>

                                  <div className={styles.expandedFooter}>
                                    <button
                                      className="btn btn--outline btn--sm"
                                      onClick={() => setExpandedApplicationId(null)}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="btn btn--primary btn--sm"
                                      disabled={isUpdatingReview || !hasReviewChanged(application)}
                                      onClick={() => void handleReviewSave(application)}
                                    >
                                      {isUpdatingReview ? 'Saving...' : 'Save review'}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.paginationBar}>
                <span className={styles.paginationInfo}>
                  Showing {Math.min(pagedApplications.length, PAGE_SIZE)} of{' '}
                  {filteredApplications.length} candidates
                </span>

                <div className={styles.paginationButtons}>
                  <button
                    className={styles.paginationButton}
                    disabled={currentPage === 1}
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  >
                    Previous
                  </button>

                  {paginationModel.map((token, index) =>
                    token === 'ellipsis' ? (
                      <span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={token}
                        className={`${styles.paginationButton} ${currentPage === token ? styles.paginationButtonActive : ''}`}
                        onClick={() => setPage(token)}
                      >
                        {token}
                      </button>
                    ),
                  )}

                  <button
                    className={styles.paginationButton}
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>
        )
      ) : null}
    </div>
  )
}
