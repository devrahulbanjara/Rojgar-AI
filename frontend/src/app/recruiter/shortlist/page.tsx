'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition } from '../../../components/common'
import { ActionButton, Button, Badge } from '../../../components/ui'
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
  Edit2,
  Save,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../../lib/utils'
import { api } from '../../../lib/api'
import type { ShortlistJob, ShortlistCandidate } from '../../../types/shortlist'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { useDeleteConfirm } from '../../../components/ui/delete-confirm-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip'


import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../../../components/ui/popover'

interface EmailDraft {
  draft_id: string
  application_id: string
  candidate_name: string
  candidate_email: string
  status: string
  subject: string
  body: string
  is_approved: boolean
  is_sent: boolean
}

function ShortlistJobCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-default bg-background-surface p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 w-full">
          <div className="h-3.5 bg-background-subtle rounded w-[70%]" />
          <div className="h-3 bg-background-subtle rounded w-[45%]" />
        </div>
        <div className="w-7 h-7 bg-background-subtle rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-[18px] bg-background-subtle rounded-full w-[54px]" />
        <div className="h-[18px] bg-background-subtle rounded-full w-[64px]" />
      </div>
    </div>
  )
}

function ShortlistCandidateCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-default bg-background-surface p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-background-subtle rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-background-subtle rounded w-40" />
            <div className="h-3 bg-background-subtle rounded w-28" />
          </div>
        </div>
        <div className="h-6 bg-background-subtle rounded-full w-16" />
      </div>

      <div className="space-y-2">
        <div className="h-3 bg-background-subtle rounded w-full" />
        <div className="h-3 bg-background-subtle rounded w-[90%]" />
        <div className="h-3 bg-background-subtle rounded w-[75%]" />
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="h-8 bg-background-subtle rounded-lg w-24" />
          <div className="h-8 bg-background-subtle rounded-lg w-20" />
        </div>
        <div className="h-8 bg-background-subtle rounded-lg w-8" />
      </div>
    </div>
  )
}

function EmailSectionSkeleton() {
  return (
    <div className="bg-background-surface rounded-xl border border-border-subtle p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-background-subtle" />
          <div className="space-y-2">
            <div className="h-4 bg-background-subtle rounded w-48" />
            <div className="h-3 bg-background-subtle rounded w-64" />
          </div>
        </div>
        <div className="h-9 bg-background-subtle rounded-lg w-40" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background-subtle/50 border border-border-subtle">
          <div className="w-2 h-2 rounded-full bg-background-subtle" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3 bg-background-subtle rounded w-20" />
            <div className="h-2.5 bg-background-subtle rounded w-24" />
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background-subtle/50 border border-border-subtle">
          <div className="w-2 h-2 rounded-full bg-background-subtle" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3 bg-background-subtle rounded w-20" />
            <div className="h-2.5 bg-background-subtle rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertBannerSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle p-4 bg-background-subtle/50 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-4 h-4 bg-background-subtle rounded mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-background-subtle rounded w-40" />
          <div className="h-3 bg-background-subtle rounded w-full" />
        </div>
      </div>
    </div>
  )
}

function ShortlistPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
      {/* Page header skeleton */}
      <div className="space-y-2 animate-pulse">
        <div className="h-8 bg-background-subtle rounded w-48" />
        <div className="h-5 bg-background-subtle rounded w-96" />
      </div>
      <div className="border-b border-border-default/60" />

      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <aside className="w-80 flex-shrink-0">
          <div className="bg-background-surface border border-border-default rounded-2xl shadow-sm flex flex-col h-full max-h-[70vh]">
            <div className="p-5 border-b border-border-subtle space-y-2 animate-pulse">
              <div className="h-3.5 bg-background-subtle rounded w-32" />
              <div className="h-3 bg-background-subtle rounded w-56" />
            </div>
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <ShortlistJobCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 min-w-0">
          <div className="bg-background-surface border border-border-default rounded-2xl shadow-sm flex flex-col h-full max-h-[70vh]">
            {/* Header skeleton */}
            <header className="p-6 border-b border-border-subtle flex justify-between items-center gap-4 animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-background-subtle rounded w-80" />
                <div className="h-3.5 bg-background-subtle rounded w-48" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 bg-background-subtle rounded-lg w-32" />
                <div className="h-9 w-9 bg-background-subtle rounded-lg" />
              </div>
            </header>

            {/* Content area skeleton */}
            <div className="max-w-5xl mx-auto px-6 py-6 space-y-6 w-full">
              {/* Alert banner skeleton */}
              <AlertBannerSkeleton />
              
              {/* Candidate cards skeleton */}
              {Array.from({ length: 3 }).map((_, index) => (
                <ShortlistCandidateCardSkeleton key={index} />
              ))}

              {/* Email section skeleton */}
              <EmailSectionSkeleton />
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
  const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>([])
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [isProcessingEmails, setIsProcessingEmails] = useState(false)
  const [sendingDraftIds, setSendingDraftIds] = useState<Set<string>>(new Set())
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)

  const loadExistingDrafts = useCallback(async () => {
    if (!selectedJob) return
    setIsLoadingDrafts(true)
    try {
      const drafts = await jobService.getEmailDrafts(selectedJob.job_id)
      if (drafts && drafts.length > 0) {
        setEmailDrafts(drafts)
      } else {
        setEmailDrafts([])
      }
    } catch (err) {
      console.error('Failed to load existing drafts:', err)
    } finally {
      setIsLoadingDrafts(false)
    }
  }, [selectedJob])

  // Load existing drafts on mount or when job changes
  useEffect(() => {
    if (selectedJob) {
      loadExistingDrafts()
    }
  }, [selectedJob, loadExistingDrafts])

  const handlePrepareDrafts = async () => {
    if (!selectedJob) return
    
    // If drafts already exist, just show a message
    if (emailDrafts.length > 0) {
      toast.info('Email drafts are already prepared. You can edit and send them from each candidate card.')
      return
    }
    
    setIsProcessingEmails(true)
    try {
      await jobService.prepareEmails(selectedJob.job_id)
      const drafts = await jobService.getEmailDrafts(selectedJob.job_id)
      setEmailDrafts(drafts)
      toast.success('Email drafts prepared successfully')
    } catch {
      toast.error('Failed to prepare email drafts')
    } finally {
      setIsProcessingEmails(false)
    }
  }

  const handleDirectSend = async () => {
    if (!selectedJob) return
    setIsProcessingEmails(true)
    try {
      // Trigger background preparation and direct sending
      await jobService.prepareEmails(selectedJob.job_id, true)
      toast.success('Successfully started sending status updates in background')
      // Reload drafts to show sent status
      setTimeout(() => loadExistingDrafts(), 2000)
    } catch {
      toast.error('Failed to send emails')
    } finally {
      setIsProcessingEmails(false)
    }
  }

  const handleEditDraft = (draft: EmailDraft) => {
    setEditingDraftId(draft.draft_id)
    setEditedSubject(draft.subject)
    setEditedBody(draft.body)
  }

  const handleSaveEdit = async (draftId: string) => {
    try {
      await jobService.updateDraft(draftId, {
        subject: editedSubject,
        body: editedBody,
      })
      
      // Update local state
      setEmailDrafts(prev =>
        prev.map(d =>
          d.draft_id === draftId
            ? { ...d, subject: editedSubject, body: editedBody }
            : d
        )
      )
      
      setEditingDraftId(null)
      toast.success('Draft updated successfully')
    } catch {
      toast.error('Failed to update draft')
    }
  }

  const handleCancelEdit = () => {
    setEditingDraftId(null)
    setEditedSubject('')
    setEditedBody('')
  }

  const handleSendSingle = async (draftId: string) => {
    setSendingDraftIds(prev => new Set(prev).add(draftId))
    try {
      await jobService.sendSingleEmail(draftId)
      
      // Update local state to mark as sent
      setEmailDrafts(prev =>
        prev.map(d =>
          d.draft_id === draftId ? { ...d, is_sent: true } : d
        )
      )
      
      toast.success('Email sent successfully')
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSendingDraftIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    }
  }

  const handleDiscardDraft = async (draftId: string) => {
    try {
      await jobService.discardDraft(draftId)
      
      // Remove from local state
      setEmailDrafts(prev => prev.filter(d => d.draft_id !== draftId))
      
      toast.success('Draft discarded')
    } catch {
      toast.error('Failed to discard draft')
    }
  }

  const handleBulkSendDrafts = async () => {
    if (!selectedJob) return
    
    const unsentDrafts = emailDrafts.filter(d => !d.is_sent)
    if (unsentDrafts.length === 0) {
      toast.info('All drafts have already been sent')
      return
    }

    setIsProcessingEmails(true)
    try {
      await jobService.sendAllEmails(selectedJob.job_id)
      
      // Mark all as sent in local state
      setEmailDrafts(prev => prev.map(d => ({ ...d, is_sent: true })))
      
      toast.success(`Successfully sent ${unsentDrafts.length} email${unsentDrafts.length !== 1 ? 's' : ''}`)
    } catch {
      toast.error('Failed to send emails')
    } finally {
      setIsProcessingEmails(false)
    }
  }

  const handleBulkDiscardDrafts = async () => {
    if (!selectedJob) return
    
    const unsentDrafts = emailDrafts.filter(d => !d.is_sent)
    if (unsentDrafts.length === 0) {
      toast.info('No unsent drafts to discard')
      return
    }

    setIsProcessingEmails(true)
    try {
      // Discard all unsent drafts
      await Promise.all(
        unsentDrafts.map(draft => jobService.discardDraft(draft.draft_id))
      )
      
      // Remove unsent drafts from local state, keep sent ones
      setEmailDrafts(prev => prev.filter(d => d.is_sent))
      
      toast.success(`Successfully discarded ${unsentDrafts.length} draft${unsentDrafts.length !== 1 ? 's' : ''}`)
    } catch {
      toast.error('Failed to discard drafts')
    } finally {
      setIsProcessingEmails(false)
    }
  }

  const handleConfirmReviewSend = async () => {
    if (!selectedJob) return
    setIsProcessingEmails(true)
    try {
      await jobService.sendAllEmails(selectedJob.job_id)
      
      // Mark all as sent in local state
      setEmailDrafts(prev => prev.map(d => ({ ...d, is_sent: true })))
      
      toast.success('Status updates sent successfully')
    } catch {
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

  const getScoreInterpretation = (_score: number) => {
    return { text: 'Match Score', color: 'text-text-tertiary' }
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
                            {selectedJob.auto_shortlist && (
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
                            )}
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
                          <Button variant="outline" size="icon" className="h-9 w-9 text-text-muted bg-background-surface dark:bg-background-surface">
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
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <ActionButton
                                        variant="primary"
                                        size="sm"
                                        className="h-9 px-6 bg-primary-600 hover:bg-primary-700 font-bold text-xs gap-2"
                                        onClick={() => {
                                          // Just open the popover, don't change workflow
                                        }}
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        Send Status Updates
                                      </ActionButton>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0 overflow-hidden border-border-default shadow-xl bg-background-surface" align="end">
                                      <div className="p-3 bg-background-subtle/50 border-b border-border-subtle">
                                        <h4 className="text-xs font-bold text-text-primary px-1">Choose Method</h4>
                                      </div>
                                      <div className="p-2 space-y-1 bg-background-surface">
                                        <button
                                          onClick={() => {
                                            handlePrepareDrafts()
                                          }}
                                          className="w-full flex flex-col items-start p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/30 text-left transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-text-primary">Review Details</span>
                                            <Badge colorPalette="blue" className="text-[8px] h-3.5 px-1 font-black uppercase">Recommended</Badge>
                                          </div>
                                          <p className="text-[10px] text-text-tertiary mt-1 leading-tight">Review AI drafts before sending.</p>
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleDirectSend()
                                          }}
                                          className="w-full flex flex-col items-start p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/30 text-left transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-text-primary">Direct Send</span>
                                            <Badge colorPalette="gray" className="text-[8px] h-3.5 px-1 font-black uppercase">Quick Action</Badge>
                                          </div>
                                          <p className="text-[10px] text-text-tertiary mt-1 leading-tight">Send immediately without review.</p>
                                        </button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
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
                                    onClick={() => {
                                      // When canceling review, go back to show candidates
                                      // Drafts will still be accessible via the "Send Status Updates" button
                                      setEmailWorkflowStep('choice')
                                    }}
                                    disabled={isProcessingEmails}
                                    className="hover:text-error-600 hover:border-error-200 hover:bg-error-50 dark:hover:bg-error-950/30"
                                  >
                                    Back to Candidates
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
                                {emailDrafts.map((draft) => {
                                  const isEditing = editingDraftId === draft.draft_id
                                  const isSending = sendingDraftIds.has(draft.draft_id)
                                  const isSent = draft.is_sent

                                  return (
                                    <div key={draft.draft_id} className="p-5 rounded-2xl border border-border-default bg-background-surface shadow-sm overflow-hidden hover:border-border-strong transition-all">
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                          <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            draft.status === 'shortlisted' ? "bg-primary-500" : "bg-error-500"
                                          )} />
                                          <span className="text-sm font-bold text-text-primary">{draft.candidate_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            colorPalette={draft.status === 'shortlisted' ? "blue" : "red"}
                                            className="text-[10px] font-black uppercase px-2 py-0.5"
                                            style={{ borderRadius: '4px' }}
                                          >
                                            {draft.status}
                                          </Badge>
                                          {isSent && (
                                            <Badge
                                              colorPalette="green"
                                              className="text-[10px] font-black uppercase px-2 py-0.5"
                                              style={{ borderRadius: '4px' }}
                                            >
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              SENT
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="text-sm text-text-secondary space-y-3">
                                        {/* Subject */}
                                        <div className="flex gap-2 text-xs">
                                          <span className="font-bold text-text-tertiary shrink-0">Subject:</span>
                                          {isEditing ? (
                                            <input
                                              type="text"
                                              value={editedSubject}
                                              onChange={(e) => setEditedSubject(e.target.value)}
                                              className="flex-1 px-2 py-1 text-xs border border-border-default rounded bg-background-default text-text-primary"
                                            />
                                          ) : (
                                            <span className="text-text-primary font-medium">{draft.subject}</span>
                                          )}
                                        </div>

                                        {/* Body */}
                                        {isEditing ? (
                                          <textarea
                                            value={editedBody}
                                            onChange={(e) => setEditedBody(e.target.value)}
                                            rows={12}
                                            className="w-full p-3 text-xs border border-border-default rounded bg-background-default text-text-primary font-mono leading-relaxed"
                                          />
                                        ) : (
                                          <div 
                                            className="p-4 bg-background-subtle/50 rounded-xl border border-border-subtle text-xs leading-relaxed [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-semibold [&_p]:text-xs [&_p]:my-2 [&_strong]:font-semibold [&_a]:text-primary-600 [&_a]:underline [&_*]:!text-text-primary [&_table]:!bg-background-surface [&_td]:!bg-background-surface [&_body]:!bg-background-default [&_img]:!max-w-[120px] [&_img]:!h-auto dark:[&_*]:!text-text-primary dark:[&_table]:!bg-background-surface dark:[&_td]:!bg-background-surface dark:[&_body]:!bg-background-default"
                                            dangerouslySetInnerHTML={{ __html: draft.body }}
                                          />
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                                          {isEditing ? (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleCancelEdit}
                                                className="text-xs"
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                size="sm"
                                                onClick={() => handleSaveEdit(draft.draft_id)}
                                                className="text-xs bg-primary-600 hover:bg-primary-700"
                                              >
                                                <Save className="w-3 h-3 mr-1" />
                                                Save Changes
                                              </Button>
                                            </>
                                          ) : isSent ? (
                                            <span className="text-xs text-text-tertiary italic">Email has been sent</span>
                                          ) : (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditDraft(draft)}
                                                className="text-xs"
                                              >
                                                <Edit2 className="w-3 h-3 mr-1" />
                                                Edit
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDiscardDraft(draft.draft_id)}
                                                className="text-xs hover:text-error-600 hover:border-error-200 hover:bg-error-50 dark:hover:bg-error-950/30"
                                              >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                Discard
                                              </Button>
                                              <Button
                                                size="sm"
                                                onClick={() => handleSendSingle(draft.draft_id)}
                                                disabled={isSending}
                                                className="text-xs bg-primary-600 hover:bg-primary-700"
                                              >
                                                {isSending ? (
                                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                  <Send className="w-3 h-3 mr-1" />
                                                )}
                                                Send
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {emailWorkflowStep === 'choice' && (
                            <>
                              {/* Bulk Actions Bar */}
                              {emailDrafts.length > 0 && selectedJob.final_shortlist_completed && (
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border-default bg-background-subtle/30 mb-4">
                                  <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    <div>
                                      <p className="text-sm font-semibold text-text-primary">
                                        {emailDrafts.filter(d => !d.is_sent).length} Draft{emailDrafts.filter(d => !d.is_sent).length !== 1 ? 's' : ''} Ready
                                      </p>
                                      <p className="text-xs text-text-tertiary">
                                        {emailDrafts.filter(d => d.is_sent).length} already sent
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleBulkDiscardDrafts}
                                      disabled={isProcessingEmails || emailDrafts.filter(d => !d.is_sent).length === 0}
                                      className="text-xs bg-background-surface dark:bg-background-surface hover:text-error-600 hover:border-error-200 hover:bg-error-50 dark:hover:bg-error-950/30"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                      Discard All Unsent
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleBulkSendDrafts}
                                      disabled={isProcessingEmails || emailDrafts.filter(d => !d.is_sent).length === 0}
                                      className="text-xs bg-primary-600 hover:bg-primary-700"
                                    >
                                      {isProcessingEmails ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                      ) : (
                                        <Send className="w-3.5 h-3.5 mr-1.5" />
                                      )}
                                      Send All Unsent
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {selectedJob.candidates
                                .sort((a, b) => {
                                  const hasScores = selectedJob.shortlist_status === 'completed'
                                  return hasScores ? b.score - a.score : 0
                                })
                                .map(candidate => {
                                // Find the email draft for this candidate
                                const candidateDraft = emailDrafts.find(
                                  draft => draft.application_id === candidate.application_id
                                )
                                
                                return (
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
                                    emailDraft={candidateDraft}
                                    isLoadingDraft={isLoadingDrafts && selectedJob.final_shortlist_completed}
                                    onSaveDraft={async (draftId, subject, body) => {
                                      try {
                                        await jobService.updateDraft(draftId, { subject, body })
                                        setEmailDrafts(prev =>
                                          prev.map(d =>
                                            d.draft_id === draftId ? { ...d, subject, body } : d
                                          )
                                        )
                                        toast.success('Draft updated successfully')
                                      } catch {
                                        toast.error('Failed to update draft')
                                      }
                                    }}
                                    onDiscardDraft={handleDiscardDraft}
                                    onSendDraft={handleSendSingle}
                                    isSendingDraft={sendingDraftIds.has(candidateDraft?.draft_id || '')}
                                  />
                                )
                              })}
                            </>
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
