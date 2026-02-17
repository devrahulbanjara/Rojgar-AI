'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, SkeletonLoader } from '../../../components/common'
import { ActionButton, Button, Badge, Avatar, AvatarImage, AvatarFallback } from '../../../components/ui'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { useAuth } from '../../../hooks/useAuth'
import { useCandidates } from '../../../hooks/useCandidates'
import { jobService } from '../../../services/jobService'
import { ShortlistJobCard } from '../../../components/shortlist/ShortlistJobCard'
import { ShortlistCandidateCard } from '../../../components/shortlist/ShortlistCandidateCard'
import {
  Users,
  Brain,
  Info,
  RefreshCw,
  Zap,
  AlertCircle,
  Loader2,
  MoreVertical,
  ClipboardList,
  CheckCheck,
  Mail,
  Send,
  Eye,
  ChevronRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../../lib/utils'
import { api } from '../../../lib/api'
import type { ShortlistJob, ShortlistCandidate } from '../../../types/shortlist'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { DeleteConfirmDialog, useDeleteConfirm } from '../../../components/ui/delete-confirm-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../../../components/ui/popover'

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

  const { confirm, Dialog: DeleteConfirmDialog } = useDeleteConfirm()

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
      {
        auto_shortlist: boolean
        status: string
        shortlist_status: string
        shortlist_threshold: number
        final_shortlist_completed: boolean
      }
    >()
    if (jobsResponse?.jobs) {
      jobsResponse.jobs.forEach(job => {
        const jobId = job.job_id?.toString() || job.id?.toString()
        if (jobId) {
          map.set(jobId, {
            auto_shortlist: job.auto_shortlist ?? false,
            status: job.status ?? 'active',
            shortlist_status: job.shortlist_status ?? 'not_started',
            shortlist_threshold: job.shortlist_threshold ?? 70,
            final_shortlist_completed: job.final_shortlist_completed ?? false,
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
          shortlist_threshold: 70,
          final_shortlist_completed: false,
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
          shortlist_threshold: meta.shortlist_threshold,
          final_shortlist_completed: meta.final_shortlist_completed,
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

  const shortlistStats = useMemo(() => {
    if (!selectedJob) return { shortlisted: 0, rejected: 0, pending: 0, total: 0 }
    return {
      shortlisted: selectedJob.candidates.filter(c => c.current_status === 'shortlisted').length,
      rejected: selectedJob.candidates.filter(c => c.current_status === 'rejected').length,
      pending: selectedJob.candidates.filter(c => c.current_status === 'applied').length,
      total: selectedJob.candidates.length,
    }
  }, [selectedJob])

  // Email Automation State
  const [emailWorkflowStep, setEmailWorkflowStep] = useState<'choice' | 'preparing' | 'reviewing' | 'sending'>('choice')
  const [selectedEmailMethod, setSelectedEmailMethod] = useState<'review' | 'direct'>('review')
  const [emailDrafts, setEmailDrafts] = useState<any[]>([])
  const [isProcessingEmails, setIsProcessingEmails] = useState(false)

  const handleProceedEmails = () => {
    if (selectedEmailMethod === 'review') {
      handlePrepareDrafts()
    } else {
      handleDirectSend()
    }
  }

  const handlePrepareDrafts = async () => {
    if (!selectedJob) return
    setIsProcessingEmails(true)
    setEmailWorkflowStep('preparing')
    try {
      await jobService.prepareEmails(selectedJob.job_id)
      const drafts = await jobService.getEmailDrafts(selectedJob.job_id)
      setEmailDrafts(drafts)
      setEmailWorkflowStep('reviewing')
    } catch (error) {
      toast.error('Failed to prepare email drafts')
      setEmailWorkflowStep('choice')
    } finally {
      setIsProcessingEmails(false)
    }
  }

  const handleDirectSend = async () => {
    if (!selectedJob) return
    setIsProcessingEmails(true)
    setEmailWorkflowStep('sending')
    try {
      // Trigger background preparation and direct sending
      await jobService.prepareEmails(selectedJob.job_id, true)
      toast.success('Successfully started sending status updates in background')
      setEmailWorkflowStep('choice')
    } catch (error) {
      toast.error('Failed to send emails')
      setEmailWorkflowStep('choice')
    } finally {
      setIsProcessingEmails(false)
    }
  }

  const handleConfirmReviewSend = async () => {
    if (!selectedJob) return
    setIsProcessingEmails(true)
    try {
      await jobService.sendAllEmails(selectedJob.job_id)
      toast.success('Status updates sent successfully')
      setEmailWorkflowStep('choice')
    } catch (error) {
      toast.error('Failed to send updates')
    } finally {
      setIsProcessingEmails(false)
    }
  }

  // Check if shortlisting is in progress
  const isShortlistInProgress = useMemo(() => {
    if (!selectedJob || selectedJob.final_shortlist_completed) return false
    return selectedJob.shortlist_status === 'in_progress'
  }, [selectedJob])

  // Check if shortlisting failed
  const isShortlistFailed = useMemo(() => {
    if (!selectedJob || selectedJob.final_shortlist_completed) return false
    return selectedJob.shortlist_status === 'failed'
  }, [selectedJob])

  // Check if this is an expired job without auto_shortlist (manual shortlisting needed)
  const canTriggerManualShortlist = useMemo(() => {
    if (!selectedJob || selectedJob.final_shortlist_completed) return false
    return (
      selectedJob.status === 'expired' &&
      !selectedJob.auto_shortlist &&
      (selectedJob.shortlist_status === 'not_started' || selectedJob.shortlist_status === 'failed')
    )
  }, [selectedJob])

  // Check if this is an expired job with auto_shortlist ON but shortlisting hasn't run yet
  const canTriggerAutoShortlist = useMemo(() => {
    if (!selectedJob || selectedJob.final_shortlist_completed) return false
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

  const updateThresholdMutation = useMutation({
    mutationFn: async ({ jobId, threshold }: { jobId: string; threshold: number }) => {
      return await jobService.updateJob(jobId, { id: jobId, shortlist_threshold: threshold })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Threshold updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update threshold')
    },
  })

  const finalizeShortlistMutation = useMutation({
    mutationFn: async ({
      jobId,
      use_ai_recommendations,
      threshold,
    }: {
      jobId: string
      use_ai_recommendations: boolean
      threshold: number
    }) => {
      return await jobService.finalizeShortlist(jobId, { use_ai_recommendations, threshold })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      if (variables.use_ai_recommendations) {
        toast.success(`AI Recommendations applied and shortlist finalized`)
      } else {
        toast.success(`Shortlist finalized successfully`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to finalize shortlist')
    },
  })

  const [editingThreshold, setEditingThreshold] = useState<number | null>(null)

  const handleThresholdChange = useCallback(
    (value: number) => {
      if (!selectedJob) return
      if (value < 0 || value > 100) return
      setEditingThreshold(value)
    },
    [selectedJob]
  )

  const handleThresholdBlur = useCallback(() => {
    if (!selectedJob || editingThreshold === null) return
    if (editingThreshold === selectedJob.shortlist_threshold) {
      setEditingThreshold(null)
      return
    }
    updateThresholdMutation.mutate(
      { jobId: selectedJob.job_id, threshold: editingThreshold },
      {
        onSuccess: () => setEditingThreshold(null),
      }
    )
  }, [selectedJob, editingThreshold, updateThresholdMutation])

  const getScoreInterpretation = (score: number) => {
    if (score >= 90)
      return { text: 'Excellent Match', color: 'text-primary-700 dark:text-primary-300' }
    if (score >= 80) return { text: 'Great Match', color: 'text-primary-600 dark:text-primary-400' }
    if (score >= 70) return { text: 'Good Match', color: 'text-primary-500 dark:text-primary-500' }
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

  const allCandidatesReviewed = useMemo(() => {
    if (!selectedJob) return false
    return selectedJob.candidates.every(
      c => c.current_status === 'shortlisted' || c.current_status === 'rejected'
    )
  }, [selectedJob])

  const unreviewedCount = useMemo(() => {
    if (!selectedJob) return 0
    return selectedJob.candidates.filter(
      c => c.current_status !== 'shortlisted' && c.current_status !== 'rejected'
    ).length
  }, [selectedJob])

  const handleAcceptAIRecommendations = useCallback(async () => {
    if (!selectedJob || selectedJob.candidates.length === 0) return

    const threshold = selectedJob.shortlist_threshold ?? 70

    await confirm({
      title: 'Finalize AI Recommendations',
      description: "You're about to apply AI recommendations for",
      itemName: `${selectedJob.candidates.length} total candidate${selectedJob.candidates.length !== 1 ? 's' : ''}`,
      additionalInfo: `This will automatically shortlist candidates with a score of ${threshold} or above, and reject those below ${threshold}. This will also mark the shortlisting as complete for this job.`,
      onConfirm: () => {
        finalizeShortlistMutation.mutate({
          jobId: selectedJob.job_id,
          use_ai_recommendations: true,
          threshold,
        })
      },
    })
  }, [confirm, selectedJob, finalizeShortlistMutation])

  const handleFinishShortlisting = useCallback(() => {
    if (!selectedJob) return
    finalizeShortlistMutation.mutate({
      jobId: selectedJob.job_id,
      use_ai_recommendations: false,
      threshold: selectedJob.shortlist_threshold ?? 70,
    })
  }, [selectedJob, finalizeShortlistMutation])

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
                              Candidates for {selectedJob.title} ({selectedJob.candidates.length})
                            </h2>
                            <div className="flex items-center gap-3 text-text-tertiary">
                              <div className="flex items-center gap-2 pl-1">
                                <span className="text-xs font-medium text-text-secondary">
                                  AI Threshold:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={
                                      editingThreshold !== null
                                        ? editingThreshold
                                        : (selectedJob.shortlist_threshold ?? 70)
                                    }
                                    onChange={e =>
                                      handleThresholdChange(parseInt(e.target.value) || 0)
                                    }
                                    onBlur={handleThresholdBlur}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        handleThresholdBlur()
                                      }
                                    }}
                                    className="w-12 px-1.5 py-0.5 text-xs font-semibold text-center border border-border-default rounded bg-background-subtle focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  />
                                  <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                                    % (≥ {selectedJob.shortlist_threshold ?? 70} shortlisted)
                                  </span>
                                </div>
                              </div>
                            </div>
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
                            <ClipboardList className="w-8 h-8 text-primary-400" />
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

                          {selectedJob.final_shortlist_completed ? (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between p-4 px-6 rounded-xl border border-primary-100 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20 gap-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                                    <CheckCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <h4 className="text-sm font-bold text-primary-900 dark:text-white leading-none">
                                      Shortlisting Finalized
                                    </h4>
                                    <p className="text-xs text-primary-700 dark:text-white/80 mt-1.5">
                                      All decisions have been made and the shortlist for this job is complete.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-background-surface rounded-xl border border-border-subtle p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-background-subtle flex items-center justify-center border border-border-subtle">
                                      <Mail className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-base font-bold text-text-primary leading-tight">Email Candidate Updates</h3>
                                      <p className="text-xs text-text-secondary mt-0.5">Automated status notifications for all applicants.</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background-subtle/50 border border-border-subtle">
                                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-text-primary">{shortlistStats.shortlisted} Shortlisted</span>
                                      <span className="text-[10px] text-text-tertiary uppercase font-medium tracking-wide">Next Stage Invite</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background-subtle/50 border border-border-subtle">
                                    <div className="w-2 h-2 rounded-full bg-error-500" />
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-text-primary">{shortlistStats.rejected} Rejected</span>
                                      <span className="text-[10px] text-text-tertiary uppercase font-medium tracking-wide">Rejection Notice</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-5 border-t border-border-subtle">
                                  <div className="flex items-center gap-2 text-text-tertiary">
                                    <ShieldCheck className="w-4 h-4 text-primary-500/70" />
                                    <p className="text-[11px] font-medium">Sends from hiring@convexhire.com</p>
                                  </div>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <ActionButton
                                        variant="primary"
                                        size="sm"
                                        className="h-9 px-6 bg-primary-600 hover:bg-primary-700 font-bold text-xs gap-2"
                                        onClick={() => {
                                          setEmailWorkflowStep('choice')
                                        }}
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        Send Status Updates
                                      </ActionButton>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0 overflow-hidden border-border-default shadow-xl" align="end">
                                      <div className="p-3 bg-background-subtle/50 border-b border-border-subtle">
                                        <h4 className="text-xs font-bold text-text-primary px-1">Choose Method</h4>
                                      </div>
                                      <div className="p-2 space-y-1">
                                        <button
                                          onClick={() => {
                                            setSelectedEmailMethod('review')
                                            handlePrepareDrafts()
                                          }}
                                          className="w-full flex flex-col items-start p-3 rounded-lg hover:bg-background-subtle text-left transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-text-primary">Review Details</span>
                                            <Badge colorPalette="blue" className="text-[8px] h-3.5 px-1 font-black uppercase">Recommended</Badge>
                                          </div>
                                          <p className="text-[10px] text-text-tertiary mt-1 leading-tight">Review AI drafts before sending.</p>
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedEmailMethod('direct')
                                            handleDirectSend()
                                          }}
                                          className="w-full flex flex-col items-start p-3 rounded-lg hover:bg-background-subtle text-left transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-text-primary">Direct Send</span>
                                            <Badge colorPalette="gray" className="text-[8px] h-3.5 px-1 font-black uppercase">Quick Action</Badge>
                                          </div>
                                          <p className="text-[10px] text-text-tertiary mt-1 leading-tight">Send templates immediately.</p>
                                        </button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </div>
                          ) :
                            selectedJob.shortlist_status === 'completed' && (
                              <div className="flex items-center justify-between p-4 px-6 rounded-xl border border-primary-100 bg-primary-50/50 dark:bg-primary-950/10 gap-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                                    <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                  </div>
                                  <div className="flex flex-col">
                                    <h4 className="text-sm font-bold text-primary-900 dark:text-primary-100 leading-none">
                                      AI analysis complete
                                    </h4>
                                    <p className="text-xs text-primary-700 dark:text-primary-300 mt-1.5">
                                      {allCandidatesReviewed
                                        ? 'All candidates have been reviewed. You can now finalize the shortlist.'
                                        : 'Use AI scores as a signal, then confirm final decisions manually.'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <ActionButton
                                    size="sm"
                                    onClick={handleAcceptAIRecommendations}
                                    variant="primary"
                                    disabled={!selectedJob || selectedJob.candidates.length === 0 || finalizeShortlistMutation.isPending}
                                    className={cn(
                                      'whitespace-nowrap h-9 px-4',
                                      (!selectedJob || selectedJob.candidates.length === 0 || finalizeShortlistMutation.isPending) &&
                                      'opacity-50 cursor-not-allowed'
                                    )}
                                  >
                                    {finalizeShortlistMutation.isPending ? 'Finalizing...' : 'Finalize AI Recommendations'}
                                  </ActionButton>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <ActionButton
                                            size="sm"
                                            onClick={handleFinishShortlisting}
                                            variant="outline"
                                            disabled={!allCandidatesReviewed || finalizeShortlistMutation.isPending}
                                            className={cn(
                                              'whitespace-nowrap h-9 px-4 flex items-center gap-2',
                                              (!allCandidatesReviewed || finalizeShortlistMutation.isPending) &&
                                              'opacity-50 cursor-not-allowed'
                                            )}
                                          >
                                            {finalizeShortlistMutation.isPending ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <CheckCheck className="w-4 h-4" />
                                            )}
                                            Finish Shortlisting
                                          </ActionButton>
                                        </span>
                                      </TooltipTrigger>
                                      {!allCandidatesReviewed && (
                                        <TooltipContent>
                                          <p className="text-xs">
                                            Review all candidates first ({unreviewedCount} remaining)
                                          </p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            )}

                          {canTriggerAutoShortlist && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-primary-200">
                              <Brain className="w-4 h-4 text-primary-600" />
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
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-primary-200">
                              <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
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

                          {/* Standalone Finish Shortlisting button for manual review */}
                          {selectedJob.candidates.length > 0 &&
                            pendingCandidates.length === 0 &&
                            selectedJob.shortlist_status !== 'completed' &&
                            !selectedJob.final_shortlist_completed &&
                            !isShortlistInProgress && (
                              <div className="flex justify-end">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <ActionButton
                                          size="sm"
                                          onClick={handleFinishShortlisting}
                                          variant="primary"
                                          disabled={!allCandidatesReviewed}
                                          className={cn(
                                            'bg-primary-600 hover:bg-primary-700 whitespace-nowrap',
                                            !allCandidatesReviewed &&
                                            'opacity-50 cursor-not-allowed'
                                          )}
                                        >
                                          <CheckCheck className="w-4 h-4" />
                                          Finish Shortlisting
                                        </ActionButton>
                                      </span>
                                    </TooltipTrigger>
                                    {!allCandidatesReviewed && (
                                      <TooltipContent>
                                        <p className="text-xs">
                                          Review all candidates first ({unreviewedCount} remaining)
                                        </p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}


                          {(emailWorkflowStep === 'preparing' || emailWorkflowStep === 'sending') && (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                              <div className="text-center">
                                <h4 className="font-bold text-text-primary">
                                  {emailWorkflowStep === 'preparing' ? 'Generating AI Drafts' : 'Sending Updates'}
                                </h4>
                                <p className="text-sm text-text-tertiary">
                                  {emailWorkflowStep === 'preparing' ? 'This may take a few seconds...' : 'Dispatching emails to candidates...'}
                                </p>
                              </div>
                            </div>
                          )}

                          {emailWorkflowStep === 'reviewing' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="flex items-center justify-between px-1">
                                <div className="flex flex-col">
                                  <h3 className="text-lg font-bold text-text-primary">Review Automated Updates</h3>
                                  <p className="text-sm text-text-tertiary">{emailDrafts.length} Messages Prepared</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEmailWorkflowStep('choice')}
                                    disabled={isProcessingEmails}
                                  >
                                    Cancel
                                  </Button>
                                  <ActionButton
                                    variant="primary"
                                    size="sm"
                                    onClick={handleConfirmReviewSend}
                                    loading={isProcessingEmails}
                                    className="gap-2 px-6"
                                  >
                                    <Send className="w-3 h-3" />
                                    Send All Update Notifications
                                  </ActionButton>
                                </div>
                              </div>
                              <div className="grid gap-4">
                                {emailDrafts.map((draft, idx) => (
                                  <div key={idx} className="p-5 rounded-2xl border border-border-default bg-background-surface shadow-sm overflow-hidden hover:border-border-strong transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-2 h-2 rounded-full",
                                          draft.status === 'shortlisted' ? "bg-primary-500" : "bg-error-500"
                                        )} />
                                        <span className="text-sm font-bold text-text-primary">{draft.candidate_name}</span>
                                      </div>
                                      <Badge
                                        colorPalette={draft.status === 'shortlisted' ? "blue" : "red"}
                                        className="text-[10px] font-black uppercase px-2 py-0.5"
                                        style={{ borderRadius: '4px' }}
                                      >
                                        {draft.status}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-text-secondary space-y-3">
                                      <div className="flex gap-2 text-xs">
                                        <span className="font-bold text-text-tertiary shrink-0">Subject:</span>
                                        <span className="text-text-primary font-medium">{draft.subject}</span>
                                      </div>
                                      <div className="p-4 bg-background-subtle/50 rounded-xl border border-border-subtle whitespace-pre-wrap italic text-xs leading-relaxed">
                                        {draft.body}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {emailWorkflowStep === 'choice' && (
                            selectedJob.candidates
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
                                  isFinalized={selectedJob.final_shortlist_completed}
                                />
                              ))
                          )}
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

      <DeleteConfirmDialog />
    </AppShell>
  )
}
