'use client'

import { Fragment, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { SetStateAction } from 'react'
import { toast } from 'react-toastify'

import { useRouter } from 'next/navigation'

import { getApplicationStatusLabel, getApplicationStatusVariant } from '@/lib/applicationStatus'
import { getInitials } from '@/lib/mediaValidation'
import {
  type ApplicationStatus,
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

import ButtonSpinner from '@/components/common/ButtonSpinner'
import MediaBadge from '@/components/common/MediaBadge'

import { ScreeningControlsSkeleton, ScreeningTableSkeleton } from './_components/ScreeningSkeletons'
import styles from './screening.module.css'

type ReviewDraft = {
  score: string
  feedback: string
}

type ScoreFilter = 'all' | 'high' | 'mid' | 'low'
type ReviewFilter = 'all' | 'reviewed' | 'pending' | 'missing'

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview_booked: 'Interview booked',
  interview_completed: 'Interview completed',
  offer: 'Offer',
  rejected: 'Rejected',
}

function getRecruiterTransitionOptions(status: ApplicationStatus): ApplicationStatus[] {
  switch (status) {
    case 'applied':
    case 'screening':
      return ['shortlisted', 'rejected']
    case 'shortlisted':
      return ['rejected']
    case 'interview_booked':
      return ['interview_completed']
    case 'interview_completed':
      return ['offer', 'rejected']
    default:
      return []
  }
}

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
  if (application.status === 'rejected') {
    return { label: 'Rejected', tone: 'danger' }
  }
  if (
    application.status === 'shortlisted' ||
    application.status === 'interview_booked' ||
    application.status === 'interview_completed' ||
    application.status === 'offer'
  ) {
    return {
      label: getApplicationStatusLabel(application.status),
      tone: getApplicationStatusVariant(application.status),
    }
  }
  if (application.status === 'screening') {
    return { label: 'Screening', tone: 'warning' }
  }
  if (hasCompleteReview(application)) {
    return { label: 'Reviewed', tone: 'success' }
  }
  if (!options.autoShortlist) {
    return { label: 'Pending', tone: 'warning' }
  }
  if (options.isAiProcessing) {
    return { label: 'Pending', tone: 'warning' }
  }
  return { label: 'Missing review', tone: 'danger' }
}

function getReviewPreview(
  application: RecruiterApplicationView,
  options: { autoShortlist: boolean; isAiProcessing: boolean },
) {
  if (application.feedback?.trim()) return application.feedback.trim()
  if (!options.autoShortlist) {
    return 'No manual review yet. Recruiters can add a score and feedback.'
  }
  if (options.isAiProcessing) {
    return 'Agent screening is in progress. This row will update when screening finishes.'
  }
  return 'No agent review yet. Click Rerun screening to generate a score and feedback.'
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

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.spinnerIcon}>
      <circle
        cx="8"
        cy="8"
        r="5.25"
        fill="none"
        opacity="0.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 2.75a5.25 5.25 0 014.52 2.58"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default function RecruiterScreeningPage() {
  const router = useRouter()
  const tableScrollerRef = useRef<HTMLDivElement | null>(null)
  const feedbackTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
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
  const [statusSelectValues, setStatusSelectValues] = useState<Record<string, ApplicationStatus>>(
    {},
  )
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const eligibleJobs = useMemo(
    () =>
      [...(jobsResp?.data ?? [])]
        .filter((job) => job.status === 'active' || job.status === 'expired')
        .sort((a, b) => {
          if (a.final_shortlist_completed !== b.final_shortlist_completed) {
            return a.final_shortlist_completed ? 1 : -1
          }
          if ((b.applications_count ?? 0) !== (a.applications_count ?? 0)) {
            return (b.applications_count ?? 0) - (a.applications_count ?? 0)
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
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const {
    data: summaryResp,
    refetch: refetchSummary,
    isLoading: isLoadingSummary,
  } = useGetShortlistSummaryQuery(activeJobId, {
    skip: !activeJobId,
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
  const isScreeningRunning = isTriggering || shouldPollSummary
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
  }

  function setScoreFilter(next: ScoreFilter) {
    if (!activeJobId) return
    setScoreFilterByJobId((prev) => ({ ...prev, [activeJobId]: next }))
  }

  function setReviewFilter(next: SetStateAction<ReviewFilter>) {
    if (!activeJobId) return
    const resolved = typeof next === 'function' ? next(reviewFilter) : next
    setReviewFilterByJobId((prev) => ({ ...prev, [activeJobId]: resolved }))
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

  useEffect(() => {
    if (!isPollingSummary || !activeJobId) return

    const intervalId = window.setInterval(() => {
      void refetchSummary().then((result) => {
        const nextSummary = 'data' in result ? result.data?.data : undefined
        if (nextSummary?.shortlist_status !== 'in_progress') {
          setIsPollingSummary(false)
        }
      })
      void refetchApps()
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [activeJobId, isPollingSummary, refetchApps, refetchSummary])

  useEffect(() => {
    const nextValues: Record<string, ApplicationStatus> = {}
    applications.forEach((application) => {
      nextValues[application.id] = application.status
    })
    setStatusSelectValues(nextValues)
  }, [applications])

  async function refreshAll() {
    await Promise.allSettled([refetchSummary(), refetchApps()])
  }

  async function handleTrigger() {
    if (!activeJobId) return
    try {
      setIsPollingSummary(true)
      const response = await triggerShortlisting(activeJobId).unwrap()
      if (response.data.shortlist_status === 'in_progress') {
        toast.success('Agent screening started.')
      } else {
        setIsPollingSummary(false)
        toast.info(response.message)
      }
      void refetchSummary()
      void refetchApps()
    } catch {
      setIsPollingSummary(false)
      toast.error('Unable to run agent screening right now.')
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
      toast.success('Screening result saved.')
      void refreshAll()
    } catch {
      toast.error('Could not save the screening result.')
    }
  }

  async function handleStatus(
    applicationId: string,
    status: ApplicationStatus,
    currentStatus?: ApplicationStatus,
  ) {
    if (updatingStatusId) return
    setUpdatingStatusId(applicationId)
    try {
      await updateStatus({ application_id: applicationId, body: { status } }).unwrap()
      setStatusSelectValues((prev) => ({ ...prev, [applicationId]: status }))
      toast.success(`Application moved to ${STATUS_LABELS[status].toLowerCase()}.`)
      void refreshAll()
    } catch {
      if (currentStatus) {
        setStatusSelectValues((prev) => ({ ...prev, [applicationId]: currentStatus }))
      }
      toast.error('Could not update application status.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  async function handleCompleteShortlist() {
    if (!activeJobId) return
    try {
      const response = await finalizeShortlist({
        jobId: activeJobId,
        use_ai_recommendations: false,
      }).unwrap()
      toast.success('Shortlisting marked complete.')
      setIsPollingSummary(false)
      if (response.data.success || response.data.final_shortlist_completed) {
        router.push(`/recruiter/jobs/${activeJobId}/outreach`)
        return
      }
      void refreshAll()
    } catch {
      toast.error('Could not complete shortlisting.')
    }
  }

  async function handleApproveAiRecommendations() {
    if (!activeJobId) return
    if (!Number.isFinite(numericThreshold) || numericThreshold < 0 || numericThreshold > 100) {
      toast.error('Threshold must be between 0 and 100.')
      return
    }

    try {
      const response = await finalizeShortlist({
        jobId: activeJobId,
        use_ai_recommendations: true,
        threshold: numericThreshold,
      }).unwrap()
      toast.success('Agent shortlisting applied.')
      setIsPollingSummary(false)
      if (response.data.success || response.data.final_shortlist_completed) {
        router.push(`/recruiter/jobs/${activeJobId}/outreach`)
        return
      }
      void refreshAll()
    } catch {
      toast.error('Could not apply agent shortlisting.')
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
        (application.status === 'applied' || application.status === 'screening') &&
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

  const isLoadingContent = isLoadingJobs || (!!activeJobId && (isLoadingSummary || isLoadingApps))
  const isBusy =
    isTriggering || isFinalizing || isUpdatingStatus || isUpdatingReview || isUpdatingJob

  function handleTableWheel(event: React.WheelEvent<HTMLDivElement>) {
    const scroller = tableScrollerRef.current
    if (!scroller) return

    const hasHorizontalOverflow = scroller.scrollWidth > scroller.clientWidth
    if (!hasHorizontalOverflow) return

    const mostlyVerticalGesture = Math.abs(event.deltaY) > Math.abs(event.deltaX)
    if (!mostlyVerticalGesture || event.deltaY === 0) return

    scroller.scrollLeft += event.deltaY
    event.preventDefault()
  }

  function resizeFeedbackTextarea(element: HTMLTextAreaElement | null) {
    if (!element) return
    element.style.height = '0px'
    element.style.height = `${element.scrollHeight}px`
  }

  function setFeedbackTextareaRef(applicationId: string, element: HTMLTextAreaElement | null) {
    feedbackTextareaRefs.current[applicationId] = element
    resizeFeedbackTextarea(element)
  }

  return (
    <div className={`dash-content container container--app-shell ${styles.screeningPage}`}>
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Screening</h2>
          <p className="dash-page-header__subtitle">
            Review applicants, edit screening scores, and make shortlisting decisions.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className="page-header-hint">
            {jobs.length} eligible job{jobs.length === 1 ? '' : 's'}
          </span>
          {activeJob ? (
            <>
              <span className="page-header-hint">
                {totalCandidates} candidate{totalCandidates === 1 ? '' : 's'}
              </span>
              <span className="page-header-hint">{reviewedCount} reviewed</span>
              <span className="page-header-hint">{pendingCount} pending</span>
              <span className="page-header-hint">{missingCount} missing agent screening</span>
            </>
          ) : null}
          {activeJob && summary && !summary.final_shortlist_completed ? (
            <>
              {canApproveAiRecommendations ? (
                <button
                  className="btn btn--outline btn--sm"
                  disabled={isBusy}
                  onClick={() => void handleApproveAiRecommendations()}
                >
                  {isFinalizing ? (
                    <>
                      <SpinnerIcon />
                      Approving...
                    </>
                  ) : (
                    'Approve Agent'
                  )}
                </button>
              ) : null}
              {isScreeningRunning ? (
                <button className="btn btn--primary btn--sm" disabled>
                  <SpinnerIcon />
                  Agent screening running
                </button>
              ) : canRunScreening ? (
                <button
                  className="btn btn--primary btn--sm"
                  disabled={isBusy}
                  onClick={() => void handleTrigger()}
                >
                  <RefreshIcon />
                  {isTriggering
                    ? 'Running...'
                    : activeJob?.auto_shortlist
                      ? `Rerun screening (${missingCount} missing)`
                      : 'Run agent screening'}
                </button>
              ) : null}

              <button
                className={`btn btn--sm ${canApproveAiRecommendations ? 'btn--outline' : 'btn--primary'}`}
                disabled={isBusy}
                onClick={() => void handleCompleteShortlist()}
              >
                {isFinalizing ? <ButtonSpinner label="Finishing..." /> : 'Finish'}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {!isLoadingJobs && !activeJobId ? (
        <div className={styles.emptyState}>
          {jobListMode === 'pending' && eligibleJobs.length > 0
            ? 'No jobs are awaiting shortlisting decisions right now. Switch to All eligible jobs to review completed ones.'
            : 'No active or expired jobs are available for screening yet.'}
        </div>
      ) : null}

      <div className={styles.contextBar}>
        <div className={styles.contextTop}>
          {isLoadingJobs ? (
            <ScreeningControlsSkeleton />
          ) : (
            <div className={styles.selectorRow}>
              <label className={`${styles.selectWrap} ${styles.selectWrapView}`}>
                <span className={styles.selectLabel}>View</span>
                <select
                  className={styles.select}
                  value={jobListMode}
                  onChange={(event) => {
                    setJobListMode(event.target.value as 'pending' | 'all')
                    setIsPollingSummary(false)
                  }}
                >
                  <option value="pending">Pending shortlisting</option>
                  <option value="all">All eligible jobs</option>
                </select>
              </label>

              <label className={`${styles.selectWrap} ${styles.selectWrapJob}`}>
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

              {activeJob && summary ? (
                <div className={styles.inlineControls}>
                  <div className={styles.thresholdCluster}>
                    <span className={styles.thresholdLabel}>Shortlist threshold</span>
                    <div className={styles.thresholdControls}>
                      <input
                        id="screening-threshold"
                        type="number"
                        min={0}
                        max={100}
                        className={styles.thresholdInput}
                        value={threshold}
                        onChange={(event) => setThreshold(event.target.value)}
                        disabled={isUpdatingJob}
                      />
                      <span className={styles.thresholdSuffix}>/100</span>
                      <button
                        className="btn btn--outline btn--sm"
                        disabled={isUpdatingJob}
                        onClick={() => void handleSaveThreshold()}
                      >
                        {isUpdatingJob ? <ButtonSpinner label="Saving..." /> : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {isLoadingContent || (activeJobId && isFetchingApps) ? (
        <ScreeningTableSkeleton rows={6} />
      ) : activeJobId ? (
        applications.length === 0 ? (
          <div className={styles.emptyState}>No applications available for this job yet.</div>
        ) : (
          <>
            <section className={styles.filterSection}>
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
            </section>

            <section className={styles.tableSection}>
              <div className={styles.tableShell}>
                <div
                  ref={tableScrollerRef}
                  className={styles.tableScroller}
                  onWheel={handleTableWheel}
                >
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
                      {filteredApplications.map((application) => {
                        const reviewText = getReviewPreview(application, {
                          autoShortlist: Boolean(activeJob?.auto_shortlist),
                          isAiProcessing: shouldPollSummary && !hasCompleteReview(application),
                        })
                        const isExpanded = expandedApplicationId === application.id
                        const draft = getReviewDraft(application)
                        const scoreTone = getScoreTone(application.score)
                        const scoreBarTone = getScoreBarTone(application.score)
                        const statusOptions = getRecruiterTransitionOptions(application.status)
                        const statusValue = statusSelectValues[application.id] ?? application.status
                        const isStatusLocked =
                          !activeJobExpired || Boolean(summary?.final_shortlist_completed)
                        const statusLockLabel = summary?.final_shortlist_completed
                          ? 'Finalized'
                          : 'After expiry'
                        const statusLockTitle = summary?.final_shortlist_completed
                          ? 'Shortlisting is finalized for this job.'
                          : 'Shortlisting decisions unlock after the job expires.'

                        return (
                          <Fragment key={application.id}>
                            <tr
                              className={`${styles.dataRow} ${isExpanded ? styles.dataRowExpanded : ''}`}
                              onClick={() =>
                                router.push(`/recruiter/candidates/${application.id}/resume`)
                              }
                            >
                              <td>
                                <div className={styles.candidateCell}>
                                  <MediaBadge
                                    src={application.applicant_avatar_url}
                                    alt={application.applicant_name}
                                    fallback={getInitials(application.applicant_name)}
                                    className={`${styles.avatar} ${getAvatarTone(application.applicant_name)}`}
                                    sizes="50px"
                                  />
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
                                  <div
                                    className={styles.statusSelectWrap}
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <select
                                      className={`resume-field__input ${styles.statusSelect}`}
                                      value={statusValue}
                                      disabled={
                                        isStatusLocked || updatingStatusId === application.id
                                      }
                                      onChange={(event) =>
                                        void handleStatus(
                                          application.id,
                                          event.target.value as ApplicationStatus,
                                          application.status,
                                        )
                                      }
                                    >
                                      <option value={application.status}>
                                        {STATUS_LABELS[application.status]}
                                      </option>
                                      {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                          {STATUS_LABELS[status]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {isStatusLocked ? (
                                    <span className={styles.lockHint} title={statusLockTitle}>
                                      <LockIcon />
                                      {statusLockLabel}
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                            </tr>

                            {isExpanded ? (
                              <tr className={styles.expandedRow}>
                                <td colSpan={4}>
                                  <div className={styles.expandedPanel}>
                                    <div className={styles.expandedGrid}>
                                      <div className={styles.editorColumn}>
                                        <div className={styles.editorHeader}>
                                          <div className={styles.expandedLabel}>
                                            Edit screening result
                                          </div>
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
                                        </div>
                                        <textarea
                                          ref={(element) =>
                                            setFeedbackTextareaRef(application.id, element)
                                          }
                                          className={styles.feedbackTextarea}
                                          rows={2}
                                          placeholder="Add score context, strengths, concerns, or recruiter notes..."
                                          value={draft.feedback}
                                          onChange={(event) => {
                                            setReviewDraft(application.id, {
                                              feedback: event.target.value,
                                            })
                                            resizeFeedbackTextarea(event.currentTarget)
                                          }}
                                        />
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
                                        disabled={
                                          isUpdatingReview || !hasReviewChanged(application)
                                        }
                                        onClick={() => void handleReviewSave(application)}
                                      >
                                        {isUpdatingReview ? (
                                          <ButtonSpinner label="Saving..." />
                                        ) : (
                                          'Save review'
                                        )}
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
              </div>
            </section>
          </>
        )
      ) : null}
    </div>
  )
}
