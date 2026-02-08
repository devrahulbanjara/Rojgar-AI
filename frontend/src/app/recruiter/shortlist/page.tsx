'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, LoadingSpinner } from '../../../components/common'
import { useAuth } from '../../../hooks/useAuth'
import { useCandidates } from '../../../hooks/useCandidates'
import { jobService } from '../../../services/jobService'
import { ShortlistJobCard } from '../../../components/shortlist/ShortlistJobCard'
import { ShortlistCandidateCard } from '../../../components/shortlist/ShortlistCandidateCard'
import {
  Users,
  Sparkles,
  ShieldCheck,
  Brain,
  Info,
  RefreshCw,
  Zap,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../lib/api'
import type { ShortlistJob, ShortlistCandidate } from '../../../types/shortlist'

export default function ShortlistPage() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const {
    data: candidatesData,
    isLoading: isCandidatesLoading,
    error,
    refetch: refetchCandidates,
  } = useCandidates()

  const {
    data: jobsResponse,
    isLoading: isJobsLoading,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['jobs', 'shortlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      return await jobService.getJobsByCompany(user.id, { limit: 1000 })
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  // Poll jobs every 5 seconds if any job is in_progress
  const isAnyJobInProgress = jobsResponse?.jobs?.some(j => j.shortlist_status === 'in_progress')

  // Track previous in_progress state to detect when shortlisting completes
  const prevInProgressRef = React.useRef(isAnyJobInProgress)

  // Refetch candidates when any job is being shortlisted
  useEffect(() => {
    if (isAnyJobInProgress) {
      const interval = setInterval(() => {
        refetchCandidates()
        refetchJobs()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isAnyJobInProgress, refetchCandidates, refetchJobs])

  // When shortlisting completes (was in_progress, now not), refetch candidates to get final scores
  useEffect(() => {
    if (prevInProgressRef.current && !isAnyJobInProgress) {
      refetchCandidates()
    }
    prevInProgressRef.current = isAnyJobInProgress
  }, [isAnyJobInProgress, refetchCandidates])

  const jobsMetaMap = useMemo(() => {
    const map = new Map<
      string,
      { auto_shortlist: boolean; status: string; shortlist_status: string }
    >()
    if (jobsResponse?.jobs) {
      jobsResponse.jobs.forEach(job => {
        const jobId = job.job_id?.toString() || job.id?.toString()
        if (jobId) {
          map.set(jobId, {
            auto_shortlist: job.auto_shortlist ?? false,
            status: job.status ?? 'active',
            shortlist_status: job.shortlist_status ?? 'not_started',
          })
        }
      })
    }
    return map
  }, [jobsResponse])

  const jobsData = useMemo(() => {
    if (!candidatesData?.candidates) return []

    const jobsMap = new Map<string, ShortlistJob>()

    candidatesData.candidates.forEach(candidate => {
      const jobId = candidate.job_id

      if (!jobsMap.has(jobId)) {
        const meta = jobsMetaMap.get(jobId) ?? {
          auto_shortlist: false,
          status: 'active',
          shortlist_status: 'not_started',
        }
        jobsMap.set(jobId, {
          job_id: jobId,
          title: candidate.job_title,
          department: undefined,
          status: meta.status,
          shortlist_status: meta.shortlist_status,
          applicant_count: 0,
          pending_reviews: 0,
          candidates: [],
          auto_shortlist: meta.auto_shortlist,
        })
      }

      const job = jobsMap.get(jobId)
      if (!job) return

      const score = candidate.score ?? 0
      const feedbackText = candidate.feedback ?? ''

      const shortlistCandidate: ShortlistCandidate = {
        application_id: candidate.application_id,
        job_id: candidate.job_id,
        candidate_id: candidate.candidate_id,
        name: candidate.name,
        phone: candidate.phone,
        picture: candidate.picture,
        professional_headline: candidate.professional_headline,
        applied_at: candidate.applied_at,
        current_status: candidate.current_status,
        score,
        feedback: feedbackText,
        recommendation: score >= 75 ? 'shortlist' : score >= 60 ? 'review' : 'reject',
        job_title: candidate.job_title,
        social_links: candidate.social_links,
      }

      job.candidates.push(shortlistCandidate)
      job.applicant_count = job.candidates.length
      job.pending_reviews = job.candidates.filter(c => c.recommendation === 'review').length
    })

    return Array.from(jobsMap.values())
  }, [candidatesData, jobsMetaMap])

  useEffect(() => {
    if (jobsData.length > 0 && !selectedJobId) {
      setSelectedJobId(jobsData[0].job_id)
    }
  }, [jobsData, selectedJobId])

  const selectedJob = useMemo(
    () => jobsData.find(job => job.job_id === selectedJobId) || null,
    [jobsData, selectedJobId]
  )

  const queryClient = useQueryClient()

  const recommendedCandidates = useMemo(() => {
    if (!selectedJob) return []
    return selectedJob.candidates.filter(c => c.score >= 75)
  }, [selectedJob])

  // Check if shortlisting is pending (auto_shortlist on but hasn't run yet)
  const isShortlistPending = useMemo(() => {
    if (!selectedJob) return false
    if (!selectedJob.auto_shortlist) return false
    return selectedJob.shortlist_status === 'not_started'
  }, [selectedJob])

  // Check if shortlisting is in progress
  const isShortlistInProgress = useMemo(() => {
    return selectedJob?.shortlist_status === 'in_progress'
  }, [selectedJob])

  // Check if shortlisting failed
  const isShortlistFailed = useMemo(() => {
    return selectedJob?.shortlist_status === 'failed'
  }, [selectedJob])

  // Check if this is an expired job without auto_shortlist (manual shortlisting needed)
  const canTriggerManualShortlist = useMemo(() => {
    if (!selectedJob) return false
    return (
      selectedJob.status === 'expired' &&
      !selectedJob.auto_shortlist &&
      (selectedJob.shortlist_status === 'not_started' || selectedJob.shortlist_status === 'failed')
    )
  }, [selectedJob])

  // Check if this is an expired job with auto_shortlist ON but shortlisting hasn't run yet
  const canTriggerAutoShortlist = useMemo(() => {
    if (!selectedJob) return false
    return (
      selectedJob.status === 'expired' &&
      selectedJob.auto_shortlist &&
      selectedJob.shortlist_status === 'not_started'
    )
  }, [selectedJob])

  // Mutation to trigger shortlisting
  const triggerShortlistMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await api.shortlisting.trigger(jobId)
    },
    onSuccess: () => {
      toast.success('Shortlisting started')
      refetchJobs()
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start shortlisting')
    },
  })

  // Mutation to update application status
  const updateApplicationMutation = useMutation({
    mutationFn: async ({
      applicationId,
      data,
    }: {
      applicationId: string
      data: { status?: string; score?: number; feedback?: string }
    }) => {
      return await api.candidates.updateApplication(applicationId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update application')
    },
  })

  const getScoreInterpretation = (score: number) => {
    if (score >= 90)
      return { text: 'Excellent Match', color: 'text-emerald-600 dark:text-emerald-400' }
    if (score >= 80) return { text: 'Great Match', color: 'text-blue-600 dark:text-blue-400' }
    if (score >= 70) return { text: 'Good Match', color: 'text-primary-600 dark:text-primary-400' }
    return { text: 'Fair Match', color: 'text-orange-600 dark:text-orange-400' }
  }

  const handleShortlist = useCallback(
    (applicationId: string) => {
      updateApplicationMutation.mutate(
        { applicationId, data: { status: 'shortlisted' } },
        { onSuccess: () => toast.success('Candidate shortlisted') }
      )
    },
    [updateApplicationMutation]
  )

  const handleReject = useCallback(
    (applicationId: string) => {
      updateApplicationMutation.mutate(
        { applicationId, data: { status: 'rejected' } },
        { onSuccess: () => toast.success('Candidate rejected') }
      )
    },
    [updateApplicationMutation]
  )

  const handleTriggerShortlist = useCallback(() => {
    if (selectedJob) {
      triggerShortlistMutation.mutate(selectedJob.job_id)
    }
  }, [selectedJob, triggerShortlistMutation])

  const handleAcceptAIRecommendations = useCallback(() => {
    setShowConfirmModal(true)
  }, [])

  const handleConfirmAcceptAI = useCallback(() => {
    recommendedCandidates.forEach(candidate => {
      handleShortlist(candidate.application_id)
    })
    setShowConfirmModal(false)

    toast.success(`Recommendations accepted for ${recommendedCandidates.length} candidates`)
  }, [recommendedCandidates, handleShortlist])

  const handleCancelAcceptAI = useCallback(() => {
    setShowConfirmModal(false)
  }, [])

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showConfirmModal) {
        handleCancelAcceptAI()
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [showConfirmModal, handleCancelAcceptAI])

  if (isAuthLoading || !isAuthenticated || isCandidatesLoading || (user?.id && isJobsLoading)) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Failed to load candidates
            </h2>
            <p className="text-text-secondary">Please try refreshing the page</p>
          </div>
        </PageTransition>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-[32px] max-lg:text-[28px] font-bold text-text-primary leading-tight tracking-tight">
                  Shortlist
                </h1>
                <p className="text-base text-text-secondary">
                  Review AI-analyzed candidates and make hiring decisions
                </p>
              </div>
            </div>
            <div className="mt-6 border-b border-border-default/60" />
          </AnimatedContainer>

          <div className="space-y-8">
            <div className="flex gap-8">
              <div className="w-72 flex-shrink-0">
                <AnimatedContainer direction="up" delay={0.2}>
                  <div className="space-y-4">
                    {jobsData.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-text-tertiary mb-2">No jobs with candidates found</div>
                        <div className="text-sm text-text-muted">
                          Candidates will appear here once they apply to jobs
                        </div>
                      </div>
                    ) : (
                      jobsData.map(job => (
                        <ShortlistJobCard
                          key={job.job_id}
                          job={job}
                          isSelected={selectedJobId === job.job_id}
                          onClick={() => setSelectedJobId(job.job_id)}
                          onAutoShortlistChange={() => {
                            setTimeout(() => refetchJobs(), 500)
                          }}
                        />
                      ))
                    )}
                  </div>
                </AnimatedContainer>
              </div>

              <div className="flex-1 min-w-0">
                <AnimatedContainer direction="up" delay={0.3}>
                  {selectedJob ? (
                    <div className="space-y-6">
                      <div className="flex items-baseline justify-between gap-3 mb-6">
                        <div className="flex items-baseline gap-3">
                          <h2 className="text-2xl font-semibold text-text-primary inline">
                            Candidates for {selectedJob.title}
                          </h2>
                          <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-md px-3 py-1 text-base font-semibold">
                            <Users className="w-4 h-4" />
                            {selectedJob.candidates.length}
                          </div>
                        </div>
                        {recommendedCandidates.length > 0 &&
                          selectedJob.shortlist_status === 'completed' && (
                            <button
                              onClick={handleAcceptAIRecommendations}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-background-surface border border-border-default text-text-secondary hover:border-border-strong hover:bg-background-subtle text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.98]"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Shortlist Recommended ({recommendedCandidates.length})
                            </button>
                          )}
                      </div>

                      {selectedJob.candidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-background-subtle/50 rounded-3xl border-2 border-dashed border-border-subtle">
                          <div className="w-20 h-20 bg-background-surface shadow-sm border border-border-subtle rounded-2xl flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-primary-300" />
                          </div>
                          <h3 className="text-xl font-bold text-text-primary mb-2">
                            No candidates found
                          </h3>
                          <p className="text-base text-text-tertiary max-w-md">
                            No candidates have applied for this job yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Show pending banner when auto-shortlist is on but job is still active */}
                          {isShortlistPending && selectedJob.status !== 'expired' && (
                            <div className="flex items-center gap-4 p-5 bg-background-subtle rounded-xl border border-border-default">
                              <div className="flex-shrink-0">
                                <Info className="w-5 h-5 text-text-tertiary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-text-primary mb-1">
                                  Shortlisting Pending
                                </h4>
                                <p className="text-sm text-text-secondary">
                                  Shortlisting will automatically run when the application deadline
                                  passes. Candidates will be scored and ranked once the job expires.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Show trigger button for expired jobs with auto_shortlist ON */}
                          {canTriggerAutoShortlist && (
                            <div className="flex items-center gap-4 p-5 bg-ai-50 dark:bg-ai-950/30 rounded-xl border border-ai-200 dark:border-ai-800">
                              <div className="flex-shrink-0">
                                <Brain className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-text-primary mb-1">
                                  Ready for AI Shortlisting
                                </h4>
                                <p className="text-sm text-text-secondary">
                                  Job has expired. Run AI shortlisting now or wait for the scheduled
                                  run at midnight.
                                </p>
                              </div>
                              <button
                                onClick={handleTriggerShortlist}
                                disabled={triggerShortlistMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-ai-600 hover:bg-ai-700 text-white rounded-lg text-sm font-medium transition-all animate-bounce"
                                style={{ animationDuration: '2s' }}
                              >
                                <Zap className="w-4 h-4" />
                                {triggerShortlistMutation.isPending
                                  ? 'Starting...'
                                  : 'Run Shortlisting'}
                              </button>
                            </div>
                          )}

                          {/* Show in-progress banner */}
                          {isShortlistInProgress && (
                            <div className="flex items-center gap-4 p-5 bg-ai-50 dark:bg-ai-950/30 rounded-xl border border-ai-200 dark:border-ai-800">
                              <div className="flex-shrink-0">
                                <Loader2 className="w-5 h-5 text-ai-600 dark:text-ai-400 animate-spin" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-text-primary mb-1">
                                  AI Shortlisting In Progress
                                </h4>
                                <p className="text-sm text-text-secondary font-mono">
                                  Candidates are being analyzed. This page will update
                                  automatically.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Show failed banner with retry */}
                          {isShortlistFailed && (
                            <div className="flex items-center gap-4 p-5 bg-error-50 dark:bg-error-950/30 rounded-xl border border-error-200 dark:border-error-800">
                              <div className="flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-text-primary mb-1">
                                  Shortlisting Failed
                                </h4>
                                <p className="text-sm text-text-secondary">
                                  An error occurred during shortlisting. You can retry.
                                </p>
                              </div>
                              <button
                                onClick={handleTriggerShortlist}
                                disabled={triggerShortlistMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-background-surface border border-border-default text-text-secondary hover:border-border-strong rounded-lg text-sm font-medium transition-all"
                              >
                                <RefreshCw
                                  className={`w-4 h-4 ${triggerShortlistMutation.isPending ? 'animate-spin' : ''}`}
                                />
                                Retry
                              </button>
                            </div>
                          )}

                          {/* Show "Run Shortlisting" button for expired jobs without auto_shortlist */}
                          {canTriggerManualShortlist && (
                            <div className="flex items-center gap-4 p-5 bg-background-subtle rounded-xl border border-border-default">
                              <div className="flex-shrink-0">
                                <Info className="w-5 h-5 text-text-tertiary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-text-primary mb-1">
                                  Manual Review Mode
                                </h4>
                                <p className="text-sm text-text-secondary">
                                  Auto-shortlisting is off. Review candidates manually or run AI
                                  shortlisting.
                                </p>
                              </div>
                              <button
                                onClick={handleTriggerShortlist}
                                disabled={triggerShortlistMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-all animate-pulse hover:animate-none"
                              >
                                <Zap className="w-4 h-4" />
                                {triggerShortlistMutation.isPending
                                  ? 'Starting...'
                                  : 'Run Shortlisting'}
                              </button>
                            </div>
                          )}

                          {selectedJob.candidates
                            .sort((a, b) => {
                              const hasScores = selectedJob.shortlist_status === 'completed'
                              return hasScores ? b.score - a.score : 0
                            })
                            .map(candidate => (
                              <ShortlistCandidateCard
                                key={candidate.application_id}
                                candidate={candidate}
                                onShortlist={handleShortlist}
                                onReject={handleReject}
                                scoreInterpretation={getScoreInterpretation(candidate.score)}
                                showScores={
                                  selectedJob.shortlist_status === 'completed' ||
                                  selectedJob.shortlist_status === 'in_progress'
                                }
                                isShortlistingInProgress={
                                  selectedJob.shortlist_status === 'in_progress'
                                }
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-background-subtle/50 rounded-3xl border-2 border-dashed border-border-subtle">
                      <div className="w-20 h-20 bg-background-surface shadow-sm border border-border-subtle rounded-2xl flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-primary-300 dark:text-primary-600" />
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-2">
                        Select a job posting
                      </h3>
                      <p className="text-base text-text-tertiary max-w-md">
                        Choose a job from the sidebar to start reviewing candidates
                      </p>
                    </div>
                  )}
                </AnimatedContainer>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>

      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-text-primary/50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCancelAcceptAI}
        >
          <div
            className="bg-background-surface rounded-2xl max-w-md w-full mx-4 border border-border-default animate-in zoom-in-95 duration-200 ease-out shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
            style={{
              padding: '40px',
              borderRadius: '16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-600" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h3
                className="text-text-primary mb-4"
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                Accept AI Recommendations
              </h3>

              <p
                className="text-text-secondary mb-3"
                style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: 1.5,
                }}
              >
                You're about to accept AI recommendations for{' '}
                <span className="font-bold text-text-primary">
                  {recommendedCandidates.length} candidates
                </span>{' '}
                for{' '}
                <span className="font-bold text-primary-600 dark:text-primary-400">
                  {selectedJob?.title}
                </span>
                .
              </p>

              <p
                className="text-text-muted"
                style={{
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: 1.5,
                }}
              >
                This will approve all AI-recommended candidates. This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancelAcceptAI}
                className="border border-border-default text-text-secondary bg-background-surface hover:bg-background-subtle hover:border-border-strong rounded-lg transition-all duration-200"
                style={{
                  minWidth: '120px',
                  height: '44px',
                  fontSize: '15px',
                  fontWeight: 500,
                  borderWidth: '1.5px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAcceptAI}
                className="btn-primary-gradient rounded-lg transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                style={{
                  minWidth: '200px',
                  height: '44px',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                Accept Recommendations
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
