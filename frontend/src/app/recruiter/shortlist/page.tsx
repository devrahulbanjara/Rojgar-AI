'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, SkeletonLoader } from '../../../components/common'
import { ActionButton, Badge, Button } from '../../../components/ui'
import { Alert, AlertDescription, AlertTitle, AlertAction } from '../../../components/ui/alert'
import { useAuth } from '../../../hooks/useAuth'
import { useCandidates } from '../../../hooks/useCandidates'
import { jobService } from '../../../services/jobService'
import { ShortlistJobCard } from '../../../components/shortlist/ShortlistJobCard'
import { ShortlistCandidateCard } from '../../../components/shortlist/ShortlistCandidateCard'
import {
  Users,
  Sparkles,
  Brain,
  Info,
  RefreshCw,
  Zap,
  AlertCircle,
  Loader2,
  MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../lib/api'
import type { ShortlistJob, ShortlistCandidate } from '../../../types/shortlist'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { useDeleteConfirm } from '../../../components/ui/delete-confirm-dialog'

function ShortlistJobCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-default bg-background-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 w-full">
          <SkeletonLoader variant="text" width="70%" height={14} />
          <SkeletonLoader variant="text" width="45%" height={12} />
        </div>
        <SkeletonLoader variant="circular" width={28} height={28} />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonLoader variant="rectangular" width={54} height={18} className="rounded-full" />
        <SkeletonLoader variant="rectangular" width={64} height={18} className="rounded-full" />
      </div>
    </div>
  )
}

function ShortlistCandidateCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-default bg-background-surface p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <SkeletonLoader variant="circular" width={44} height={44} />
          <div className="space-y-2">
            <SkeletonLoader variant="text" width={160} height={16} />
            <SkeletonLoader variant="text" width={120} height={12} />
          </div>
        </div>
        <SkeletonLoader variant="rectangular" width={66} height={24} className="rounded-full" />
      </div>

      <div className="space-y-2">
        <SkeletonLoader variant="text" width="100%" height={12} />
        <SkeletonLoader variant="text" width="90%" height={12} />
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <SkeletonLoader variant="circular" width={14} height={14} />
          <SkeletonLoader variant="text" width={86} height={12} />
        </div>
        <div className="flex gap-2">
          <SkeletonLoader variant="rectangular" width={90} height={34} className="rounded-lg" />
          <SkeletonLoader variant="rectangular" width={90} height={34} className="rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function ShortlistPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="24%" height={34} />
        <SkeletonLoader variant="text" width="46%" height={18} />
      </div>
      <div className="border-b border-border-default/60" />

      <div className="flex gap-6">
        <aside className="w-80 flex-shrink-0">
          <div className="bg-background-surface border border-border-default rounded-2xl shadow-sm flex flex-col h-full max-h-[70vh]">
            <div className="p-5 border-b border-border-subtle space-y-2">
              <SkeletonLoader variant="text" width="46%" height={14} />
              <SkeletonLoader variant="text" width="84%" height={12} />
            </div>
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <ShortlistJobCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-background-surface border border-border-default rounded-2xl shadow-sm flex flex-col h-full max-h-[70vh]">
            <header className="p-6 border-b border-border-subtle flex justify-between items-center gap-4">
              <div className="space-y-2 w-full">
                <SkeletonLoader variant="text" width="44%" height={24} />
                <SkeletonLoader variant="text" width="28%" height={14} />
              </div>
              <SkeletonLoader
                variant="rectangular"
                width={120}
                height={34}
                className="rounded-lg"
              />
            </header>

            <div className="max-w-5xl mx-auto px-6 py-6 space-y-6 w-full">
              <div className="rounded-xl border border-border-default p-4">
                <SkeletonLoader variant="text" width="52%" height={14} />
              </div>
              {Array.from({ length: 3 }).map((_, index) => (
                <ShortlistCandidateCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ShortlistPage() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const { confirm, Dialog } = useDeleteConfirm()

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

  const pendingCandidates = useMemo(() => {
    if (!selectedJob) return []
    return selectedJob.candidates.filter(
      c => c.current_status === 'pending' || c.current_status === 'applied'
    )
  }, [selectedJob])

  const handleAcceptAIRecommendations = useCallback(async () => {
    await confirm({
      title: 'Finalize AI Recommendations',
      description: "You're about to accept AI recommendations for",
      itemName: `${pendingCandidates.length} candidate${pendingCandidates.length !== 1 ? 's' : ''}`,
      additionalInfo:
        'This will automatically shortlist or reject each candidate based on their AI score.',
      onConfirm: () => {
        pendingCandidates.forEach(candidate => {
          if (candidate.score >= 75) {
            handleShortlist(candidate.application_id)
          } else {
            handleReject(candidate.application_id)
          }
        })
        toast.success(`Recommendations accepted for ${pendingCandidates.length} candidates`)
      },
    })
  }, [confirm, pendingCandidates, handleShortlist, handleReject])

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        {isAuthLoading || !isAuthenticated || isCandidatesLoading || (user?.id && isJobsLoading) ? (
          <ShortlistPageSkeleton />
        ) : error ? (
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Failed to load candidates
              </h2>
              <p className="text-text-secondary">Please try refreshing the page</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
            {/* Page header, aligned with Jobs/Candidates */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-[32px] max-lg:text-[28px] font-bold text-text-primary leading-tight tracking-tight">
                  Shortlist
                </h1>
                <p className="text-base text-text-secondary">
                  Review AI-analyzed candidates and make final hiring decisions
                </p>
              </div>
            </div>
            <div className="border-b border-border-default/60" />

            {/* Main two-column layout */}
            <div className="flex gap-6">
              {/* High-density job sidebar */}
              <aside className="w-80 flex-shrink-0">
                <div className="bg-background-surface border border-border-default rounded-2xl shadow-sm flex flex-col h-full max-h-[70vh]">
                  <div className="p-5 border-b border-border-subtle">
                    <h2 className="text-sm font-semibold text-text-primary tracking-tight">
                      Job Shortlists
                    </h2>
                    <p className="text-[12px] text-text-tertiary mt-1">
                      Select a job to review its ranked candidates.
                    </p>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                      {jobsData.length === 0 ? (
                        <div className="text-center py-8 px-3">
                          <p className="text-sm text-text-secondary">
                            No jobs with candidates yet.
                          </p>
                          <p className="text-xs text-text-tertiary mt-1">
                            Candidates will appear here once they apply.
                          </p>
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
                  </ScrollArea>
                </div>
              </aside>

              {/* Main content card */}
              <main className="flex-1 min-w-0">
                <div className="bg-background-surface border border-border-default rounded-2xl shadow-sm flex flex-col h-full max-h-[70vh]">
                  {/* Header with AI status toggle */}
                  <header className="p-6 border-b border-border-subtle flex justify-between items-center gap-4">
                    {selectedJob ? (
                      <>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl font-semibold text-text-primary">
                              Candidates for {selectedJob.title}
                            </h2>
                            <Badge
                              variant="outline"
                              className="text-text-secondary bg-background-subtle border-border-subtle"
                            >
                              <Users className="w-3 h-3 mr-1" />
                              {selectedJob.candidates.length} total
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {(canTriggerManualShortlist || canTriggerAutoShortlist) && (
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-primary-600 hover:bg-primary-700 text-xs px-4"
                              disabled={triggerShortlistMutation.isPending}
                              onClick={handleTriggerShortlist}
                            >
                              {triggerShortlistMutation.isPending
                                ? 'Running...'
                                : 'Run AI Shortlist'}
                            </Button>
                          )}
                          <Button variant="outline" size="icon" className="h-9 w-9 text-text-muted">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <h2 className="text-lg font-semibold text-text-primary">
                            Select a job to get started
                          </h2>
                          <p className="text-sm text-text-secondary mt-1">
                            Pick a posting on the left to see AI-ranked candidates.
                          </p>
                        </div>
                      </div>
                    )}
                  </header>

                  {/* Candidate list area */}
                  <ScrollArea className="flex-1">
                    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                      {!selectedJob ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-16 h-16 bg-background-subtle rounded-2xl flex items-center justify-center mb-4 border border-border-subtle">
                            <Sparkles className="w-8 h-8 text-primary-400" />
                          </div>
                          <h3 className="text-lg font-bold text-text-primary mb-1">
                            Choose a job to review
                          </h3>
                          <p className="text-sm text-text-secondary max-w-sm">
                            Pick a posting from the left to see AI-ranked candidates and take
                            action.
                          </p>
                        </div>
                      ) : selectedJob.candidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-16 h-16 bg-background-subtle rounded-2xl flex items-center justify-center mb-4 border border-border-subtle">
                            <Users className="w-8 h-8 text-primary-300" />
                          </div>
                          <h3 className="text-lg font-bold text-text-primary mb-1">
                            No candidates yet
                          </h3>
                          <p className="text-sm text-text-secondary max-w-sm">
                            Once candidates apply, they’ll appear here with AI-powered scores.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Subtle status banners */}
                          {isShortlistPending && selectedJob.status !== 'expired' && (
                            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                              <Info className="w-4 h-4 text-blue-600" />
                              <AlertTitle className="text-blue-900 dark:text-blue-100">
                                Auto-shortlist enabled
                              </AlertTitle>
                              <AlertDescription className="text-blue-700 dark:text-blue-300">
                                Shortlisting will run automatically when the job closes. Scores will
                                appear here once processing is complete.
                              </AlertDescription>
                            </Alert>
                          )}

                          {pendingCandidates.length > 0 &&
                            selectedJob.shortlist_status === 'completed' && (
                              <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                                <Brain className="w-4 h-4 text-emerald-600" />
                                <AlertTitle className="text-emerald-900 dark:text-emerald-100">
                                  AI analysis complete
                                </AlertTitle>
                                <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                                  Use AI scores as a signal, then confirm final decisions manually.
                                </AlertDescription>
                                <AlertAction>
                                  <ActionButton
                                    size="sm"
                                    onClick={handleAcceptAIRecommendations}
                                    variant="primary"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    Finalize
                                  </ActionButton>
                                </AlertAction>
                              </Alert>
                            )}

                          {canTriggerAutoShortlist && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-ai-50 border border-ai-200">
                              <Brain className="w-4 h-4 text-ai-600" />
                              <p className="text-xs text-text-secondary flex-1">
                                This job has expired. Run AI shortlisting now to generate ranked
                                recommendations.
                              </p>
                              <ActionButton
                                onClick={handleTriggerShortlist}
                                disabled={triggerShortlistMutation.isPending}
                                loading={triggerShortlistMutation.isPending}
                                variant="primary"
                                size="sm"
                              >
                                <Zap className="w-4 h-4" />
                                {triggerShortlistMutation.isPending ? 'Starting…' : 'Run AI'}
                              </ActionButton>
                            </div>
                          )}

                          {isShortlistInProgress && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-ai-50 border border-ai-200">
                              <Loader2 className="w-4 h-4 text-ai-600 animate-spin" />
                              <p className="text-xs text-text-secondary">
                                AI shortlisting is running. Candidates will update live as scores
                                are computed.
                              </p>
                            </div>
                          )}

                          {isShortlistFailed && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-error-50 border border-error-200">
                              <AlertCircle className="w-4 h-4 text-error-600" />
                              <p className="text-xs text-text-secondary flex-1">
                                Shortlisting failed. You can retry running AI or continue manual
                                review.
                              </p>
                              <ActionButton
                                onClick={handleTriggerShortlist}
                                disabled={triggerShortlistMutation.isPending}
                                loading={triggerShortlistMutation.isPending}
                                variant="outline"
                                size="sm"
                              >
                                <RefreshCw
                                  className={`w-4 h-4 ${triggerShortlistMutation.isPending ? 'animate-spin' : ''}`}
                                />
                                Retry
                              </ActionButton>
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
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </main>
            </div>
          </div>
        )}
      </PageTransition>

      <Dialog />
    </AppShell>
  )
}
